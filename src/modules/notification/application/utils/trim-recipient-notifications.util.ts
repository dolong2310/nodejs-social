import { NOTIFICATION_MAX_PER_USER } from '@/modules/notification/application/constants/notification.constants';
import type { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';

/**
 * Ensure the user's total notification count does not exceed NOTIFICATION_MAX_PER_USER:
 * - Count existing notifications.
 * - If over the limit, find the oldest notifications and delete the excess.
 */
export async function trimRecipientNotifications(
  notificationRepository: NotificationRepositoryPort,
  recipientUserId: string
): Promise<void> {
  const count = await notificationRepository.countForRecipient(recipientUserId);
  const limit = count - NOTIFICATION_MAX_PER_USER;
  if (limit <= 0) return;
  const ids = await notificationRepository.findOldestNotificationIdsForTrim({
    recipientId: recipientUserId,
    limit
  });
  await notificationRepository.deleteNotificationsByIds(ids);
}
