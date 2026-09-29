import {
  MarkNotificationReadInputPort,
  MarkNotificationReadPort
} from '@/modules/notification/application/use-cases/mark-notification-read/mark-notification-read.port';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';

export class MarkNotificationReadUseCase extends MarkNotificationReadPort {
  constructor(private readonly notificationRepository: NotificationRepositoryPort) {
    super();
  }

  async execute(input: MarkNotificationReadInputPort): Promise<void> {
    const { viewerId, notificationId } = new MarkNotificationReadInputPort(input);
    await this.notificationRepository.updateReadByIds({ recipientId: viewerId, ids: [notificationId] });
  }
}
