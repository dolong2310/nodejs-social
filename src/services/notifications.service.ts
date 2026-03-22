import { NOTIFICATION_MAX_PER_USER, NOTIFICATION_SOCKET_EVENT } from '@/constants/notification.constant';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { NotificationsPageDTO, toNotificationListItem } from '@/dtos/responses/notification.response.dto';
import { IChat } from '@/models/schemas/chat.schema';
import { IChatMessage } from '@/models/schemas/chatMessage.schema';
import {
  IAddedToGroupNotificationPayload,
  IFriendAcceptedNotificationPayload,
  IFriendRequestNotificationPayload,
  INewMessageNotificationPayload,
  INotification,
  NewMessagePreviewKind
} from '@/models/schemas/notification.schema';
import NotificationSchema from '@/models/schemas/notification.schema';
import { IUser } from '@/models/schemas/user.schema';
import { BlockRepository } from '@/repositories/block.repository';
import { INotificationRepository } from '@/repositories/notification.repository';
import { IUserRepository } from '@/repositories/user.repository';
import { BadRequestError, NotFoundError } from '@/responses/error.response';
import { BaseService } from '@/services/base.service';
import { decodeNotificationCursor, encodeNotificationCursor } from '@/utils/notification-cursor.util';
import { ObjectId } from 'mongodb';

export interface ISocketUserEmitter {
  emitToUser(userId: string, event: string, data: unknown): void;
}

export interface INotificationsService {
  bindSocketEmitter(emitter: ISocketUserEmitter | null): void;
  listForViewer(
    viewerId: string,
    limit: number,
    cursor?: string,
    unreadOnly?: boolean
  ): Promise<NotificationsPageDTO>;
  markRead(viewerId: string, ids?: string[]): Promise<void>;
  markSingleRead(viewerId: string, notificationId: string): Promise<void>;
  recordFriendRequest(recipientUserId: string, fromUserId: string): Promise<void>;
  recordFriendAccepted(originalRequesterUserId: string, accepterUserId: string): Promise<void>;
  /** One row per recipient (D-09); caller supplies user ids excluding sender (chat service applies block D-13). */
  recordNewMessage(message: IChatMessage, senderUserId: string, recipientUserIds: string[]): Promise<void>;
  recordAddedToGroup(inviteeUserId: string, inviterUserId: string, chat: IChat): Promise<void>;
}

class NotificationsService extends BaseService implements INotificationsService {
  private socketEmitter: ISocketUserEmitter | null = null;

  constructor(
    private readonly notificationRepository: INotificationRepository,
    private readonly userRepository: IUserRepository,
    private readonly blockRepository: BlockRepository
  ) {
    super();
  }

  bindSocketEmitter(emitter: ISocketUserEmitter | null): void {
    this.socketEmitter = emitter;
  }

  private async buildActor(userId: string): Promise<INotification['actor']> {
    const user = await this.userRepository.findById<IUser>(userId);
    if (!user) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.USER_NOT_FOUND);
    }
    return {
      userId: user._id.toHexString(),
      displayName: user.name,
      avatar: user.avatar
    };
  }

  private emitToRecipient(recipientUserId: string, doc: INotification): void {
    if (!this.socketEmitter) return;
    this.socketEmitter.emitToUser(recipientUserId, NOTIFICATION_SOCKET_EVENT, {
      notification: toNotificationListItem(doc)
    });
  }

  private async trimIfNeeded(recipientId: ObjectId): Promise<void> {
    const count = await this.notificationRepository.countForRecipient(recipientId);
    const excess = count - NOTIFICATION_MAX_PER_USER;
    if (excess <= 0) return;
    const ids = await this.notificationRepository.findOldestIdsForTrim(recipientId, excess);
    await this.notificationRepository.deleteByIds(ids);
  }

  private async persistAndEmit(recipientHex: string, doc: INotification): Promise<void> {
    await this.notificationRepository.insertOne(doc);
    await this.trimIfNeeded(doc.recipientId);
    this.emitToRecipient(recipientHex, doc);
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

  async recordFriendRequest(recipientUserId: string, fromUserId: string): Promise<void> {
    const actor = await this.buildActor(fromUserId);
    const payload: IFriendRequestNotificationPayload = { fromUserId };
    const doc = new NotificationSchema({
      recipientId: new ObjectId(recipientUserId),
      type: 'friend_request',
      actor,
      payload
    });
    await this.persistAndEmit(recipientUserId, doc);
  }

  async recordFriendAccepted(originalRequesterUserId: string, accepterUserId: string): Promise<void> {
    const actor = await this.buildActor(accepterUserId);
    const payload: IFriendAcceptedNotificationPayload = { friendUserId: accepterUserId };
    const doc = new NotificationSchema({
      recipientId: new ObjectId(originalRequesterUserId),
      type: 'friend_accepted',
      actor,
      payload
    });
    await this.persistAndEmit(originalRequesterUserId, doc);
  }

  async recordNewMessage(message: IChatMessage, senderUserId: string, recipientUserIds: string[]): Promise<void> {
    const actor = await this.buildActor(senderUserId);
    const payload = this.newMessagePayload(message);
    for (const rid of recipientUserIds) {
      if (rid === senderUserId) continue;
      const doc = new NotificationSchema({
        recipientId: new ObjectId(rid),
        type: 'new_message',
        actor,
        payload
      });
      await this.persistAndEmit(rid, doc);
    }
  }

  async recordAddedToGroup(inviteeUserId: string, inviterUserId: string, chat: IChat): Promise<void> {
    const actor = await this.buildActor(inviterUserId);
    const payload: IAddedToGroupNotificationPayload = {
      chatId: chat._id.toHexString(),
      chatName: chat.name
    };
    const doc = new NotificationSchema({
      recipientId: new ObjectId(inviteeUserId),
      type: 'added_to_group',
      actor,
      payload
    });
    await this.persistAndEmit(inviteeUserId, doc);
  }

  async listForViewer(
    viewerId: string,
    limit: number,
    cursor?: string,
    unreadOnly?: boolean
  ): Promise<NotificationsPageDTO> {
    const viewerOid = new ObjectId(viewerId);
    const blocked = await this.blockRepository.listUserIdsBlockedInEitherDirection(viewerOid);
    const blockedHex = new Set(blocked.map((id) => id.toHexString()));

    let before: { createdAt: Date; _id: ObjectId } | undefined;
    if (cursor) {
      try {
        before = decodeNotificationCursor(cursor);
      } catch {
        throw new BadRequestError(VALIDATION_ERROR_MESSAGE.CHAT_INVALID_CURSOR);
      }
    }

    const pageSize = Math.min(100, Math.max(1, limit));
    const actorNin = [...blockedHex];
    const rows = await this.notificationRepository.findPageBeforeCursor(
      viewerOid,
      pageSize + 1,
      before,
      unreadOnly,
      actorNin.length > 0 ? actorNin : undefined
    );
    const hasMore = rows.length > pageSize;
    const slice = rows.slice(0, pageSize);
    const next =
      hasMore && slice.length > 0
        ? encodeNotificationCursor(slice[slice.length - 1].createdAt, slice[slice.length - 1]._id)
        : null;

    return {
      notifications: slice.map(toNotificationListItem),
      nextCursor: next
    };
  }

  async markRead(viewerId: string, ids?: string[]): Promise<void> {
    const recipientId = new ObjectId(viewerId);
    if (ids && ids.length > 0) {
      const oids = ids.map((id) => new ObjectId(id));
      await this.notificationRepository.markReadByIds(recipientId, oids);
      return;
    }
    await this.notificationRepository.markAllRead(recipientId);
  }

  async markSingleRead(viewerId: string, notificationId: string): Promise<void> {
    await this.markRead(viewerId, [notificationId]);
  }
}

export default NotificationsService;
