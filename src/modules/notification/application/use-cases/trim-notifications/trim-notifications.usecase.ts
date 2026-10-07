import {
  type TrimNotificationsInputPort,
  TrimNotificationsPort,
  TrimNotificationsOutputPort
} from '@/modules/notification/application/use-cases/trim-notifications/trim-notifications.port';
import { trimRecipientNotifications } from '@/modules/notification/application/utils/trim-recipient-notifications.util';
import type { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';

// Limit DB pressure during trimming (best-effort).
const BATCH_SIZE = 5;

export class TrimNotificationsUseCase extends TrimNotificationsPort {
  constructor(private readonly notificationRepository: NotificationRepositoryPort) {
    super();
  }

  async execute(input: TrimNotificationsInputPort): Promise<TrimNotificationsOutputPort> {
    const recipientUserIds = [...new Set(input.recipientUserIds)];
    let processedRecipients = 0;

    for (let i = 0; i < recipientUserIds.length; i += BATCH_SIZE) {
      const batch = recipientUserIds.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((rid) => trimRecipientNotifications(this.notificationRepository, rid)));
      processedRecipients += batch.length;
    }

    return new TrimNotificationsOutputPort({ processedRecipients });
  }
}
