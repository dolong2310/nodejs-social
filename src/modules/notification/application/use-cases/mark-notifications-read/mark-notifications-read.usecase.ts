import {
  MarkNotificationsReadInputPort,
  MarkNotificationsReadPort
} from '@/modules/notification/application/use-cases/mark-notifications-read/mark-notifications-read.port';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';

/**
 * Called when the user has read one or more notifications.
 * - If ids is not empty, mark each id as read.
 * - If ids is empty, mark all unread notifications as read.
 */
export class MarkNotificationsReadUseCase extends MarkNotificationsReadPort {
  constructor(private readonly notificationRepository: NotificationRepositoryPort) {
    super();
  }

  async execute(input: MarkNotificationsReadInputPort): Promise<void> {
    const { viewerId, ids } = new MarkNotificationsReadInputPort(input);

    if (ids && ids.length > 0) {
      await this.notificationRepository.updateReadByIds({ recipientId: viewerId, ids });
      return;
    }
    await this.notificationRepository.updateAllRead(viewerId);
  }
}
