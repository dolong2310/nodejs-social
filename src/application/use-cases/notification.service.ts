import { IChatMessage } from '@/domain/entities/chat-message.entity';
import {
  IAddedToGroupNotificationPayload,
  IFriendAcceptedNotificationPayload,
  IFriendRequestNotificationPayload,
  INewMessageNotificationPayload,
  INotification,
  NewMessagePreviewKind
} from '@/domain/entities/notification.entity';
import { IBlockRepository } from '@/domain/repositories/block/block.repository';
import { INotificationRepository } from '@/domain/repositories/notification/notification.repository';
import { IUserRepository } from '@/domain/repositories/user/user.repository';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';

import {
  NOTIFICATION_MAX_PER_USER,
  NOTIFICATION_SOCKET_EVENT
} from '@/application/common/constants/notification.constant';
import { decodeCursorOrThrow } from '@/application/common/cursor-codec/cursor-decoder.codec';
import {
  decodeNotificationCursor,
  encodeNotificationCursor
} from '@/application/common/cursor-codec/notification.cursor-codec';
import {
  ListForViewerPayloadDTO,
  MarkReadPayloadDTO,
  MarkSingleReadPayloadDTO,
  RecordAddedToGroupPayloadDTO,
  RecordFriendAcceptedPayloadDTO,
  RecordFriendRequestPayloadDTO,
  RecordNewMessagePayloadDTO
} from '@/application/dtos/notification/notification.payload.dto';
import {
  ListForViewerResultDTO,
  NotificationListItemDTO
} from '@/application/dtos/notification/notification.result.dto';
import {
  NotificationActorUserNotFoundException,
  NotificationInvalidCursorException
} from '@/application/errors/notification.error';
import { INotificationTrimQueue } from '@/application/ports/notification-trim-job.port';
import { INotificationsService, ISocketUserEmitter } from '@/application/ports/notification.port';
import { BaseService } from '@/application/use-cases/base.service';

function notificationSummary(n: INotification): string {
  switch (n.type) {
    case 'friend_request':
      return `${n.actor.displayName} đã gửi lời mời kết bạn`;
    case 'friend_accepted':
      return `${n.actor.displayName} đã chấp nhận lời mời kết bạn`;
    case 'new_message': {
      const p = n.payload as INewMessageNotificationPayload;
      if (p.previewKind === 'attachment') {
        return 'Đã gửi một ảnh';
      }
      if (p.previewText) {
        return p.previewText.length > 80 ? `${p.previewText.slice(0, 80)}…` : p.previewText;
      }
      return 'Tin nhắn mới';
    }
    case 'added_to_group':
      return `${n.actor.displayName} đã thêm bạn vào nhóm chat`;
    default:
      return 'Thông báo';
  }
}

export class NotificationsService extends BaseService implements INotificationsService {
  private socketEmitter: ISocketUserEmitter | null = null;
  private static readonly NEW_MESSAGE_OPTIMIZE_THRESHOLD = 50;
  private static readonly ACTOR_CACHE_TTL_MS = 60000;
  private static readonly ACTOR_CACHE_MAX_ENTRIES = 5000;
  private readonly actorCache = this.createTtlCapCache<string, INotification['actor']>(
    NotificationsService.ACTOR_CACHE_TTL_MS,
    NotificationsService.ACTOR_CACHE_MAX_ENTRIES
  );

  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly userRepository: IUserRepository,
    private readonly blockRepository: IBlockRepository,
    private readonly notificationTrimJobQueue: INotificationTrimQueue
  ) {
    super();
  }

  public bindSocketEmitter(emitter: ISocketUserEmitter | null): void {
    this.socketEmitter = emitter;
  }

  private async buildActor(userId: string): Promise<INotification['actor']> {
    const now = Date.now();
    const cached = this.actorCache.get(userId, now);
    if (cached) return cached;

    const user = await this.userRepository.findUserById({ id: userId });
    if (!user) {
      throw NotificationActorUserNotFoundException;
    }
    const actor = {
      userId: user.id,
      displayName: user.name,
      avatar: user.avatar
    };
    this.actorCache.set(userId, actor, now);
    return actor;
  }

  private emitToRecipient(recipientUserId: string, doc: INotification): void {
    if (!this.socketEmitter) return;
    this.socketEmitter.emitToUser(recipientUserId, NOTIFICATION_SOCKET_EVENT, {
      notification: new NotificationListItemDTO({
        id: doc.id,
        read: doc.read,
        createdAt: doc.createdAt.toISOString(),
        type: doc.type,
        summary: notificationSummary(doc),
        actor: doc.actor,
        payload: doc.payload
      })
    });
  }

  /**
   * Sau khi insert noti mới, đảm bảo tổng số noti của user này không vượt NOTIFICATION_MAX_PER_USER:
   * - Đếm tổng noti hiện có
   * - Nếu vượt quá thì tìm các noti cũ nhất và xóa bớt
   */
  private async trimIfNeeded(recipientUserId: string): Promise<void> {
    const count = await this.notificationRepository.countForRecipient({ recipientId: recipientUserId });
    const excess = count - NOTIFICATION_MAX_PER_USER;
    if (excess <= 0) return;
    const ids = await this.notificationRepository.findOldestNotificationIdsForTrim({
      recipientId: recipientUserId,
      take: excess
    });
    await this.notificationRepository.deleteNotificationsByIds(ids);
  }

  /**
   * Hàm được gọi khi có notification mới được tạo.
   * - Thêm notification vào database
   * - trimIfNeeded để không vượt NOTIFICATION_MAX_PER_USER
   * - emit notification đến recipient
   */
  private async persistAndEmit(recipientId: string, doc: INotification): Promise<void> {
    await this.notificationRepository.createNotification(doc);
    await this.trimIfNeeded(doc.recipientId);
    this.emitToRecipient(recipientId, doc);
  }

  private newMessagePayload(message: IChatMessage): INewMessageNotificationPayload {
    const text = message.text?.trim();
    const hasText = Boolean(text && text.length > 0);
    const hasAtt = Boolean(message.attachments && message.attachments.length > 0);
    let previewKind: NewMessagePreviewKind;
    let previewText: string | undefined;
    if (hasText && !hasAtt) {
      previewKind = 'text';
      previewText = text!.length > 200 ? `${text!.slice(0, 200)}…` : text;
    } else if (!hasText && hasAtt) {
      previewKind = 'attachment';
    } else if (hasText && hasAtt) {
      previewKind = 'mixed';
      previewText = text!.length > 200 ? `${text!.slice(0, 200)}…` : text;
    } else {
      previewKind = 'text';
      previewText = undefined;
    }
    return {
      conversationId: message.conversationId,
      messageId: message.id,
      previewKind,
      previewText
    };
  }

  /**
   * Hàm dùng để lấy danh sách thông báo (notifications) cho một user đang xem, có hỗ trợ:
   * - Lọc theo người bị block (không hiển thị thông báo từ user mà mình block hoặc block mình).
   * - Filter chỉ thông báo chưa đọc nếu unreadOnly = true.
   */
  async listForViewer({
    viewerId,
    limit,
    cursor,
    unreadOnly
  }: ListForViewerPayloadDTO): Promise<ListForViewerResultDTO> {
    const { ids } = await this.blockRepository.listUserIdsBlockedInEitherDirection({ viewerUserId: viewerId });
    const blockedIds = new Set(ids);

    const before: DateIdCursor | undefined = decodeCursorOrThrow(
      cursor,
      decodeNotificationCursor,
      NotificationInvalidCursorException
    );

    const pageSize = Math.min(100, Math.max(1, limit));
    // Danh sách id user không được xuất hiện trong trường actor của notification (vì đã block).
    const actorNin = [...blockedIds];
    // lấy danh sách notification cho user, có filter block + unread + cursor.
    const rows = await this.notificationRepository.findNotifications({
      recipientId: viewerId,
      limit: pageSize + 1,
      before,
      unreadOnly,
      actorUserIdNin: actorNin.length > 0 ? actorNin : undefined
    });
    const hasMore = rows.length > pageSize;
    const slice = rows.slice(0, pageSize);

    const items: NotificationListItemDTO[] = slice.map(
      (doc) =>
        new NotificationListItemDTO({
          id: doc.id,
          read: doc.read,
          createdAt: doc.createdAt.toISOString(),
          type: doc.type,
          summary: notificationSummary(doc),
          actor: doc.actor,
          payload: doc.payload
        })
    );
    const nextCursor =
      hasMore && slice.length > 0
        ? encodeNotificationCursor(slice[slice.length - 1].createdAt, slice[slice.length - 1].id)
        : null;

    return new ListForViewerResultDTO(items, nextCursor);
  }

  /**
   * Hàm được gọi khi user đã đọc một hoặc nhiều thông báo.
   * - Nếu ids không trống, mark read cho từng id.
   * - Nếu ids trống, mark read cho tất cả thông báo chưa đọc.
   */
  async markRead({ viewerId, ids }: MarkReadPayloadDTO): Promise<void> {
    if (ids && ids.length > 0) {
      await this.notificationRepository.updateReadByIds({ recipientId: viewerId, ids });
      return;
    }
    await this.notificationRepository.updateAllRead({ recipientId: viewerId });
  }

  async markSingleRead({ viewerId, notificationId }: MarkSingleReadPayloadDTO): Promise<void> {
    await this.markRead({ viewerId, ids: [notificationId] });
  }

  /**
   * Hàm được gọi khi một lời mời kết bạn được chấp nhận.
   * notification cần có thông tin "ai đã làm hành động này" để client hiển thị (ví dụ: "A đã gửi lời mời kết bạn").
   */
  async recordFriendRequest({ recipientUserId, fromUserId }: RecordFriendRequestPayloadDTO): Promise<void> {
    const actor = await this.buildActor(fromUserId);
    const payload: IFriendRequestNotificationPayload = { fromUserId };
    const doc: INotification = {
      id: '123', // TODO: CRITICAL: generate id
      read: false,
      createdAt: new Date(),
      // readAt: null
      recipientId: recipientUserId,
      type: 'friend_request',
      actor,
      payload
    };
    await this.persistAndEmit(recipientUserId, doc);
  }

  /**
   * Hàm được gọi khi một lời mời kết bạn được chấp nhận.
   * notification cần có thông tin "ai đã làm hành động này" để client hiển thị (ví dụ: "A đã chấp nhận lời mời kết bạn của bạn").
   */
  async recordFriendAccepted({
    originalRequesterUserId,
    accepterUserId
  }: RecordFriendAcceptedPayloadDTO): Promise<void> {
    const actor = await this.buildActor(accepterUserId);
    const payload: IFriendAcceptedNotificationPayload = { friendUserId: accepterUserId };
    const doc: INotification = {
      id: '123',
      read: false,
      createdAt: new Date(),
      // readAt: null
      recipientId: originalRequesterUserId,
      type: 'friend_accepted',
      actor,
      payload
    };
    await this.persistAndEmit(originalRequesterUserId, doc);
  }

  /**
   * Hàm này tạo notification “new_message” cho tất cả những người nhận liên quan (trừ chính người gửi).
   * notification cần có thông tin "ai đã làm hành động này" để client hiển thị (ví dụ: "A đã gửi tin nhắn mới").
   */
  async recordNewMessage({ message, senderUserId, recipientUserIds }: RecordNewMessagePayloadDTO): Promise<void> {
    // Lọc ra những người nhận liên quan (trừ chính người gửi)
    const recipients = [...new Set(recipientUserIds)].filter((rid) => rid !== senderUserId);
    const actor = await this.buildActor(senderUserId);
    const payload = this.newMessagePayload(message);

    if (recipients.length === 0) return;

    // Small group: keep current sync flow (insertOne + trim + emit) for correctness.
    if (recipients.length < NotificationsService.NEW_MESSAGE_OPTIMIZE_THRESHOLD) {
      for (const rid of recipients) {
        const doc: INotification = {
          id: '123',
          read: false,
          createdAt: new Date(),
          // readAt: null
          recipientId: rid,
          type: 'new_message',
          actor,
          payload
        };
        await this.persistAndEmit(rid, doc);
      }
      return;
    }

    // Large group: insert many + emit immediately, trimming runs in background.
    const docs: INotification[] = recipients.map((rid) => ({
      id: '123',
      read: false,
      createdAt: new Date(),
      // readAt: null
      recipientId: rid,
      type: 'new_message',
      actor,
      payload
    }));

    await this.notificationRepository.createNotifications(docs);

    for (const doc of docs) {
      this.emitToRecipient(doc.recipientId, doc);
    }

    void this.notificationTrimJobQueue.add({ recipientUserIds: recipients }).catch(() => {});
  }

  /**
   * Hàm được gọi khi một người dùng được thêm vào một nhóm chat.
   * notification cần có thông tin "ai đã làm hành động này" để client hiển thị (ví dụ: "A đã thêm bạn vào nhóm chat").
   */
  async recordAddedToGroup({ inviteeUserId, inviterUserId, conv }: RecordAddedToGroupPayloadDTO): Promise<void> {
    const actor = await this.buildActor(inviterUserId);
    const payload: IAddedToGroupNotificationPayload = {
      conversationId: conv.id,
      chatName: conv.name
    };
    const doc: INotification = {
      id: '123',
      read: false,
      createdAt: new Date(),
      // readAt: null
      recipientId: inviteeUserId,
      type: 'added_to_group',
      actor,
      payload
    };
    await this.persistAndEmit(inviteeUserId, doc);
  }
}
