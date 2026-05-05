import {
  MarkNotificationReadCommand,
  MarkNotificationReadPort
} from '@/modules/notification/application/use-cases/mark-notification-read/mark-notification-read.port';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';

export class MarkNotificationReadUseCase extends MarkNotificationReadPort {
  constructor(private readonly notificationRepository: NotificationRepositoryPort) {
    super();
  }

  async execute(command: MarkNotificationReadCommand): Promise<void> {
    const { viewerId, notificationId } = new MarkNotificationReadCommand(command);
    await this.notificationRepository.updateReadByIds({ recipientId: viewerId, ids: [notificationId] });
  }
}
