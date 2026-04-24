import {
  MarkNotificationReadCommand,
  MarkNotificationReadInPort
} from '@/application/use-cases/notification/mark-notification-read/mark-notification-read.in-port';
import { NotificationRepositoryPort } from '@/domain/repositories/notification/notification.repository';

export class MarkNotificationReadInteractor extends MarkNotificationReadInPort {
  constructor(private readonly notificationRepository: NotificationRepositoryPort) {
    super();
  }

  async execute(command: MarkNotificationReadCommand): Promise<void> {
    const { viewerId, notificationId } = new MarkNotificationReadCommand(command);
    await this.notificationRepository.updateReadByIds({ recipientId: viewerId, ids: [notificationId] });
  }
}
