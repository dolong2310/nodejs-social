import { ChatMessageEntity } from '@/modules/conversation/domain/entities/chat-message.entity';
import { RealtimeEmitterPort } from '@/modules/core/application/ports/realtime-emitter.port';
import {
  NOTIFICATION_MAX_PER_USER,
  NOTIFICATION_SOCKET_EVENT
} from '@/modules/notification/application/constants/notification.constants';
import { NotificationTrimQueuePort } from '@/modules/notification/application/ports/notification-trim-job.port';
import {
  RecordAddedToGroupPayload,
  RecordFriendAcceptedPayload,
  RecordFriendRequestPayload,
  RecordNewMessagePayload
} from '@/modules/notification/application/services/notification.service.type';
import { notificationSummary } from '@/modules/notification/application/utils/notification-summary.util';
import { NotificationEntity } from '@/modules/notification/domain/entities/notification.entity';
import {
  EnumNewMessagePreviewKind,
  EnumNotificationType,
  IAddedToGroupNotificationPayload,
  IFriendAcceptedNotificationPayload,
  IFriendRequestNotificationPayload,
  INewMessageNotificationPayload,
  NotificationFullProps
} from '@/modules/notification/domain/entities/notification.type';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';
import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';
import { UserServicePort } from '@/modules/user/application/services/user.service';

export interface NotificationServicePort {
  trimRecipientIfNeeded(recipientUserId: string): Promise<void>;
  recordFriendRequest(payload: RecordFriendRequestPayload): Promise<void>;
  recordFriendAccepted(payload: RecordFriendAcceptedPayload): Promise<void>;
  recordNewMessage(payload: RecordNewMessagePayload): Promise<void>;
  recordAddedToGroup(payload: RecordAddedToGroupPayload): Promise<void>;
}

export class NotificationService implements NotificationServicePort {
  private static readonly NEW_MESSAGE_OPTIMIZE_THRESHOLD = 50;
  private static readonly ACTOR_CACHE_TTL_MS = 60000;
  private static readonly ACTOR_CACHE_MAX_ENTRIES = 5000;
  private readonly actorCache = createTtlCapCache<string, NotificationFullProps['actor']>(
    NotificationService.ACTOR_CACHE_TTL_MS,
    NotificationService.ACTOR_CACHE_MAX_ENTRIES
  );

  constructor(
    private readonly notificationRepository: NotificationRepositoryPort,
    private readonly notificationTrimQueue: NotificationTrimQueuePort,
    private readonly userService: UserServicePort,
    private readonly realtimeEmitter: RealtimeEmitterPort
  ) {}

  private async buildActor(userId: string): Promise<NotificationFullProps['actor']> {
    const now = Date.now();
    const cached = this.actorCache.get(userId, now);
    if (cached) return cached;

    const user = await this.userService.findUserById(userId, { querySafe: true });

    if (!user) {
      throw new UserNotFoundException();
    }
    const actor = {
      userId: user.id,
      displayName: user.name,
      avatar: user.avatar
    };
    this.actorCache.set(userId, actor, now);
    return actor;
  }

  private emitToRecipient(recipientUserId: string, entity: NotificationEntity): void {
    const notification = entity.toObject();
    if (!this.realtimeEmitter) return;
    this.realtimeEmitter.emitToUser(recipientUserId, NOTIFICATION_SOCKET_EVENT, {
      notification: {
        ...notification,
        summary: notificationSummary(entity)
      }
    });
  }

  /**
   * Called when a new notification is created.
   * - Add notification to the database.
   * - trimRecipientIfNeeded so the recipient does not exceed NOTIFICATION_MAX_PER_USER.
   * - emit notification to the recipient.
   */
  private async persistAndEmit(recipientId: string, entity: NotificationEntity): Promise<void> {
    await this.notificationRepository.createNotification(entity);
    await this.trimRecipientIfNeeded(entity.getProps().recipientId);
    this.emitToRecipient(recipientId, entity);
  }

  private newMessagePayload(entity: ChatMessageEntity): INewMessageNotificationPayload {
    const message = entity.toObject();
    const text = message.text?.trim();
    const hasText = Boolean(text && text.length > 0);
    const hasAtt = Boolean(message.attachments && message.attachments.length > 0);
    let previewKind: EnumNewMessagePreviewKind;
    let previewText: string | undefined;
    if (hasText && !hasAtt) {
      previewKind = EnumNewMessagePreviewKind.TEXT;
      previewText = text!.length > 200 ? `${text!.slice(0, 200)}…` : text;
    } else if (!hasText && hasAtt) {
      previewKind = EnumNewMessagePreviewKind.ATTACHMENT;
    } else if (hasText && hasAtt) {
      previewKind = EnumNewMessagePreviewKind.MIXED;
      previewText = text!.length > 200 ? `${text!.slice(0, 200)}…` : text;
    } else {
      previewKind = EnumNewMessagePreviewKind.TEXT;
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
   * After inserting a new notification, ensure the user's total notification count does not exceed NOTIFICATION_MAX_PER_USER:
   * - Count existing notifications.
   * - If over the limit, find the oldest notifications and delete the excess.
   */
  async trimRecipientIfNeeded(recipientUserId: string): Promise<void> {
    const count = await this.notificationRepository.countForRecipient(recipientUserId);
    const limit = count - NOTIFICATION_MAX_PER_USER;
    if (limit <= 0) return;
    const ids = await this.notificationRepository.findOldestNotificationIdsForTrim({
      recipientId: recipientUserId,
      limit
    });
    await this.notificationRepository.deleteNotificationsByIds(ids);
  }

  /**
   * Called when a friend request is created.
   * The notification needs "who performed this action" so the client can display it, e.g. "A sent a friend request".
   */
  async recordFriendRequest({ recipientUserId, fromUserId }: RecordFriendRequestPayload): Promise<void> {
    const actor = await this.buildActor(fromUserId);
    const payload: IFriendRequestNotificationPayload = { fromUserId };
    const entity = NotificationEntity.create({
      recipientId: recipientUserId,
      type: EnumNotificationType.FRIEND_REQUEST,
      actor,
      payload,
      read: false
    });
    await this.persistAndEmit(recipientUserId, entity);
  }

  /**
   * Called when a friend request is accepted.
   * The notification needs "who performed this action" so the client can display it, e.g. "A accepted your friend request".
   */
  async recordFriendAccepted({ originalRequesterUserId, accepterUserId }: RecordFriendAcceptedPayload): Promise<void> {
    const actor = await this.buildActor(accepterUserId);
    const payload: IFriendAcceptedNotificationPayload = { friendUserId: accepterUserId };
    const entity = NotificationEntity.create({
      recipientId: originalRequesterUserId,
      type: EnumNotificationType.FRIEND_ACCEPTED,
      actor,
      payload,
      read: false
    });
    await this.persistAndEmit(originalRequesterUserId, entity);
  }

  /**
   * Create a "new_message" notification for all relevant recipients except the sender.
   * The notification needs "who performed this action" so the client can display it, e.g. "A sent a new message".
   */
  async recordNewMessage({ message, senderUserId, recipientUserIds }: RecordNewMessagePayload): Promise<void> {
    // Filter relevant recipients, excluding the sender.
    const recipientIds = [...new Set(recipientUserIds)].filter((rid) => rid !== senderUserId);
    const actor = await this.buildActor(senderUserId);
    const payload = this.newMessagePayload(message);

    if (recipientIds.length === 0) return;

    const entities: NotificationEntity[] = recipientIds.map((recipientId) =>
      NotificationEntity.create({
        recipientId,
        type: EnumNotificationType.NEW_MESSAGE,
        actor,
        payload,
        read: false
      })
    );

    // Small group: keep current sync flow (insertOne + trim + emit) for correctness.
    if (recipientIds.length < NotificationService.NEW_MESSAGE_OPTIMIZE_THRESHOLD) {
      for (const entity of entities) {
        await this.persistAndEmit(entity.getProps().recipientId, entity);
      }
      return;
    }

    // Large group: insert many + emit immediately, trimming runs in background.
    await this.notificationRepository.createNotifications(entities);

    for (const entity of entities) {
      this.emitToRecipient(entity.getProps().recipientId, entity);
    }

    void this.notificationTrimQueue
      .add({ recipientUserIds: recipientIds })
      .catch((err) => console.warn('[notification] trim enqueue failed', err));
  }

  /**
   * Called when a user is added to a group chat.
   * The notification needs "who performed this action" so the client can display it, e.g. "A added you to a group chat".
   */
  async recordAddedToGroup({ inviteeUserId, inviterUserId, conv }: RecordAddedToGroupPayload): Promise<void> {
    const actor = await this.buildActor(inviterUserId);
    const payload: IAddedToGroupNotificationPayload = {
      conversationId: conv.id.toString(),
      chatName: conv.getProps().name
    };
    const entity = NotificationEntity.create({
      recipientId: inviteeUserId,
      type: EnumNotificationType.ADDED_TO_GROUP,
      actor,
      payload,
      read: false
    });
    await this.persistAndEmit(inviteeUserId, entity);
  }
}

/**
 * In-memory cache with TTL and max-entries cap.
 * - TTL (ms) is counted from set time.
 * - When entry count exceeds the limit, cache scans expired keys and removes oldest keys gradually.
 * - Applies to any value type (generic).
 */
function createTtlCapCache<K, V>(ttlMs: number, maxEntries: number) {
  const store = new Map<K, { value: V; expiresAt: number }>();

  const sweepExpired = (now: number) => {
    for (const [key, entry] of store) {
      if (entry.expiresAt <= now) {
        store.delete(key);
      }
    }
  };

  const enforceCap = (now: number) => {
    if (store.size < maxEntries) return;
    sweepExpired(now);
    while (store.size >= maxEntries) {
      const oldestKey = store.keys().next().value as K | undefined;
      if (oldestKey === undefined) break;
      store.delete(oldestKey);
    }
  };

  return {
    get(key: K, now: number = Date.now()): V | undefined {
      const entry = store.get(key);
      if (!entry) return undefined;
      if (entry.expiresAt <= now) {
        store.delete(key);
        return undefined;
      }
      return entry.value;
    },
    set(key: K, value: V, now: number = Date.now()): void {
      enforceCap(now);
      store.set(key, { value, expiresAt: now + ttlMs });
    }
  };
}
