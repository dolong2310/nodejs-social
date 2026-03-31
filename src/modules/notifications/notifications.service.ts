import { NOTIFICATION_MAX_PER_USER, NOTIFICATION_SOCKET_EVENT, VALIDATION_ERROR_MESSAGE } from '@/constants';
import {
  BaseService,
  BlockRepository,
  IAddedToGroupNotificationPayload,
  IChatMessage,
  IConversation,
  IFriendAcceptedNotificationPayload,
  IFriendRequestNotificationPayload,
  INewMessageNotificationPayload,
  INotification,
  INotificationRepository,
  IUser,
  IUserRepository,
  NewMessagePreviewKind,
  NotificationSchema,
  NotificationsPageDTO,
  toNotificationListItem
} from '@/modules';
import { BadRequestError, INotificationTrimJobQueue, NotFoundError } from '@/providers';
import { decodeNotificationCursor, encodeNotificationCursor } from '@/utils';

export interface ISocketUserEmitter {
  emitToUser(userId: string, event: string, data: unknown): void;
}

export interface INotificationsService {
  bindSocketEmitter(emitter: ISocketUserEmitter | null): void;
  listForViewer(viewerId: string, limit: number, cursor?: string, unreadOnly?: boolean): Promise<NotificationsPageDTO>;
  markRead(viewerId: string, ids?: string[]): Promise<void>;
  markSingleRead(viewerId: string, notificationId: string): Promise<void>;
  recordFriendRequest(recipientUserId: string, fromUserId: string): Promise<void>;
  recordFriendAccepted(originalRequesterUserId: string, accepterUserId: string): Promise<void>;
  /** One row per recipient (D-09); caller supplies user ids excluding sender (chat service applies block D-13). */
  recordNewMessage(message: IChatMessage, senderUserId: string, recipientUserIds: string[]): Promise<void>;
  recordAddedToGroup(inviteeUserId: string, inviterUserId: string, conv: IConversation): Promise<void>;
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
    private readonly blockRepository: BlockRepository,
    private readonly notificationTrimJobQueue: INotificationTrimJobQueue
  ) {
    super();
  }

  bindSocketEmitter(emitter: ISocketUserEmitter | null): void {
    this.socketEmitter = emitter;
  }

  private async buildActor(userId: string): Promise<INotification['actor']> {
    const now = Date.now();
    const cached = this.actorCache.get(userId, now);
    if (cached) return cached;

    const user = await this.userRepository.findById<IUser>(userId);
    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }
    const actor = {
      userId: user._id.toHexString(),
      displayName: user.name,
      avatar: user.avatar
    };
    this.actorCache.set(userId, actor, now);
    return actor;
  }

  private emitToRecipient(recipientUserId: string, doc: INotification): void {
    if (!this.socketEmitter) return;
    this.socketEmitter.emitToUser(recipientUserId, NOTIFICATION_SOCKET_EVENT, {
      notification: toNotificationListItem(doc)
    });
  }

  /**
   * Sau khi insert noti mới, đảm bảo tổng số noti của user này không vượt NOTIFICATION_MAX_PER_USER:
   * - Đếm tổng noti hiện có
   * - Nếu vượt quá thì tìm các noti cũ nhất và xóa bớt
   */
  private async trimIfNeeded(recipientUserId: string): Promise<void> {
    const count = await this.notificationRepository.countForRecipient(recipientUserId);
    const excess = count - NOTIFICATION_MAX_PER_USER;
    if (excess <= 0) return;
    const ids = await this.notificationRepository.findOldestIdsForTrim(recipientUserId, excess);
    await this.notificationRepository.deleteByIds(ids);
  }

  /**
   * Hàm được gọi khi có notification mới được tạo.
   * - Thêm notification vào database
   * - trimIfNeeded để không vượt NOTIFICATION_MAX_PER_USER
   * - emit notification đến recipient
   */
  private async persistAndEmit(recipientId: string, doc: INotification): Promise<void> {
    await this.notificationRepository.insertOne(doc);
    await this.trimIfNeeded(doc.recipientId.toHexString());
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
      chatId: message.chatId.toHexString(),
      messageId: message._id.toHexString(),
      previewKind,
      previewText
    };
  }

  /**
   * Hàm được gọi khi một lời mời kết bạn được chấp nhận.
   * notification cần có thông tin "ai đã làm hành động này" để client hiển thị (ví dụ: "A đã gửi lời mời kết bạn").
   */
  async recordFriendRequest(recipientUserId: string, fromUserId: string): Promise<void> {
    const actor = await this.buildActor(fromUserId);
    const payload: IFriendRequestNotificationPayload = { fromUserId };
    const doc = new NotificationSchema({
      recipientId: recipientUserId,
      type: 'friend_request',
      actor,
      payload
    });
    await this.persistAndEmit(recipientUserId, doc);
  }

  /**
   * Hàm được gọi khi một lời mời kết bạn được chấp nhận.
   * notification cần có thông tin "ai đã làm hành động này" để client hiển thị (ví dụ: "A đã chấp nhận lời mời kết bạn của bạn").
   */
  async recordFriendAccepted(originalRequesterUserId: string, accepterUserId: string): Promise<void> {
    const actor = await this.buildActor(accepterUserId);
    const payload: IFriendAcceptedNotificationPayload = { friendUserId: accepterUserId };
    const doc = new NotificationSchema({
      recipientId: originalRequesterUserId,
      type: 'friend_accepted',
      actor,
      payload
    });
    await this.persistAndEmit(originalRequesterUserId, doc);
  }

  /**
   * Hàm này tạo notification “new_message” cho tất cả những người nhận liên quan (trừ chính người gửi).
   * notification cần có thông tin "ai đã làm hành động này" để client hiển thị (ví dụ: "A đã gửi tin nhắn mới").
   */
  async recordNewMessage(message: IChatMessage, senderUserId: string, recipientUserIds: string[]): Promise<void> {
    // Lọc ra những người nhận liên quan (trừ chính người gửi)
    const recipients = [...new Set(recipientUserIds)].filter((rid) => rid !== senderUserId);
    const actor = await this.buildActor(senderUserId);
    const payload = this.newMessagePayload(message);

    if (recipients.length === 0) return;

    // Small group: keep current sync flow (insertOne + trim + emit) for correctness.
    if (recipients.length < NotificationsService.NEW_MESSAGE_OPTIMIZE_THRESHOLD) {
      for (const rid of recipients) {
        const doc = new NotificationSchema({
          recipientId: rid,
          type: 'new_message',
          actor,
          payload
        });
        await this.persistAndEmit(rid, doc);
      }
      return;
    }

    // Large group: insert many + emit immediately, trimming runs in background.
    const docs = recipients.map(
      (rid) =>
        new NotificationSchema({
          recipientId: rid,
          type: 'new_message',
          actor,
          payload
        })
    );

    await this.notificationRepository.insertMany(docs);

    for (const doc of docs) {
      this.emitToRecipient(doc.recipientId.toHexString(), doc);
    }

    void this.notificationTrimJobQueue.add({ recipientUserIds: recipients }).catch(() => {});
  }

  /**
   * Hàm được gọi khi một người dùng được thêm vào một nhóm chat.
   * notification cần có thông tin "ai đã làm hành động này" để client hiển thị (ví dụ: "A đã thêm bạn vào nhóm chat").
   */
  async recordAddedToGroup(inviteeUserId: string, inviterUserId: string, conv: IConversation): Promise<void> {
    const actor = await this.buildActor(inviterUserId);
    const payload: IAddedToGroupNotificationPayload = {
      chatId: conv._id.toHexString(),
      chatName: conv.name
    };
    const doc = new NotificationSchema({
      recipientId: inviteeUserId,
      type: 'added_to_group',
      actor,
      payload
    });
    await this.persistAndEmit(inviteeUserId, doc);
  }

  /**
   * Hàm dùng để lấy danh sách thông báo (notifications) cho một user đang xem, có hỗ trợ:
   * - Lọc theo người bị block (không hiển thị thông báo từ user mà mình block hoặc block mình).
   * - Filter chỉ thông báo chưa đọc nếu unreadOnly = true.
   */
  async listForViewer(
    viewerId: string,
    limit: number,
    cursor?: string,
    unreadOnly?: boolean
  ): Promise<NotificationsPageDTO> {
    const blocked = await this.blockRepository.listUserIdsBlockedInEitherDirection(viewerId);
    const blockedIds = new Set(blocked);

    let before: { createdAt: Date; _id: string } | undefined;
    if (cursor) {
      try {
        before = decodeNotificationCursor(cursor);
      } catch {
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.INVALID_CURSOR);
      }
    }

    const pageSize = Math.min(100, Math.max(1, limit));
    // Danh sách id user không được xuất hiện trong trường actor của notification (vì đã block).
    const actorNin = [...blockedIds];
    // lấy danh sách notification cho user, có filter block + unread + cursor.
    const rows = await this.notificationRepository.findPageBeforeCursor(
      viewerId,
      pageSize + 1,
      before,
      unreadOnly,
      actorNin.length > 0 ? actorNin : undefined
    );
    const hasMore = rows.length > pageSize;
    const slice = rows.slice(0, pageSize);
    const next =
      hasMore && slice.length > 0
        ? encodeNotificationCursor(slice[slice.length - 1].createdAt, slice[slice.length - 1]._id.toHexString())
        : null;

    return {
      notifications: slice.map(toNotificationListItem),
      nextCursor: next
    };
  }

  /**
   * Hàm được gọi khi user đã đọc một hoặc nhiều thông báo.
   * - Nếu ids không trống, mark read cho từng id.
   * - Nếu ids trống, mark read cho tất cả thông báo chưa đọc.
   */
  async markRead(viewerId: string, ids?: string[]): Promise<void> {
    if (ids && ids.length > 0) {
      await this.notificationRepository.markReadByIds(viewerId, ids);
      return;
    }
    await this.notificationRepository.markAllRead(viewerId);
  }

  async markSingleRead(viewerId: string, notificationId: string): Promise<void> {
    await this.markRead(viewerId, [notificationId]);
  }
}
