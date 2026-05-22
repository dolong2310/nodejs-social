import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import {
  ListNotificationsPort,
  ListNotificationsQuery,
  ListNotificationsResult,
  NotificationSummary
} from '@/modules/notification/application/use-cases/list-notifications/list-notifications.port';
import { notificationSummary } from '@/modules/notification/application/utils/notification-summary.util';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';
import { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';

/**
 * Fetch notifications for the viewing user, with support for:
 * - Filtering blocked users (hide notifications from users I blocked or who blocked me).
 * - Filtering only unread notifications when unreadOnly = true.
 */
export class ListNotificationsUseCase extends ListNotificationsPort {
  constructor(
    private readonly notificationRepository: NotificationRepositoryPort,
    private readonly blockRepository: BlockRepositoryPort
  ) {
    super();
  }

  async execute(query: ListNotificationsQuery): Promise<ListNotificationsResult> {
    const { viewerId, limit, cursor, unreadOnly } = new ListNotificationsQuery(query);

    const ids = await this.blockRepository.listUserIdsBlockedInEitherDirection(viewerId);
    const blockedIds = new Set(ids);

    const before = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);

    const pageSize = Math.min(100, Math.max(1, limit));
    const actorNin = [...blockedIds]; // user ids that must not appear in notification.actor because they are blocked
    // Load notifications for the user with block + unread + cursor filters.
    const results = await this.notificationRepository.findNotifications({
      recipientId: viewerId,
      limit: pageSize + 1,
      before,
      unreadOnly,
      actorUserIdNin: actorNin.length > 0 ? actorNin : undefined
    });
    const hasMore = results.length > pageSize;
    const slice = results.slice(0, pageSize);

    if (slice.length === 0) {
      return new ListNotificationsResult({ items: [], nextCursor: null });
    }

    const items: NotificationSummary[] = slice.map((entity) => ({
      ...entity.toObject(),
      summary: notificationSummary(entity)
    }));
    const last = slice[slice.length - 1].toObject();
    const nextCursor = hasMore ? encodeCursor(last.createdAt, last.id) : null;

    return new ListNotificationsResult({ items, nextCursor });
  }
}
