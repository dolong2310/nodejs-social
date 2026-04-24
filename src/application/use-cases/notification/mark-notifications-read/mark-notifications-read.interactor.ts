import {
  MarkNotificationsReadCommand,
  MarkNotificationsReadInPort
} from '@/application/use-cases/notification/mark-notifications-read/mark-notifications-read.in-port';
import { NotificationRepositoryPort } from '@/domain/repositories/notification/notification.repository';

/**
 * Hàm được gọi khi user đã đọc một hoặc nhiều thông báo.
 * - Nếu ids không trống, mark read cho từng id.
 * - Nếu ids trống, mark read cho tất cả thông báo chưa đọc.
 */
export class MarkNotificationsReadInteractor extends MarkNotificationsReadInPort {
  constructor(private readonly notificationRepository: NotificationRepositoryPort) {
    super();
  }

  async execute(command: MarkNotificationsReadCommand): Promise<void> {
    const { viewerId, ids } = new MarkNotificationsReadCommand(command);

    if (ids && ids.length > 0) {
      await this.notificationRepository.updateReadByIds({ recipientId: viewerId, ids });
      return;
    }
    await this.notificationRepository.updateAllRead(viewerId);
  }
}
