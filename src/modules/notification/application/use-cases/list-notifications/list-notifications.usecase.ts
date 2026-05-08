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
 * Hàm dùng để lấy danh sách thông báo (notifications) cho một user đang xem, có hỗ trợ:
 * - Lọc theo người bị block (không hiển thị thông báo từ user mà mình block hoặc block mình).
 * - Filter chỉ thông báo chưa đọc nếu unreadOnly = true.
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
    const actorNin = [...blockedIds]; // Danh sách id user không được xuất hiện trong trường actor của notification (vì đã block)
    // lấy danh sách notification cho user, có filter block + unread + cursor
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
