import { NOTIFICATION_MAX_PER_USER } from '@/modules/notification/application/constants/notification.constants';
import { TrimNotificationsInputPort } from '@/modules/notification/application/use-cases/trim-notifications/trim-notifications.port';
import { TrimNotificationsUseCase } from '@/modules/notification/application/use-cases/trim-notifications/trim-notifications.usecase';
import type { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

describe('TrimNotificationsUseCase', () => {
  it('checks each distinct recipient once', async () => {
    const notificationRepository = mockPort<NotificationRepositoryPort>({
      countForRecipient: vi.fn().mockResolvedValue(0)
    });
    const useCase = new TrimNotificationsUseCase(notificationRepository);
    const recipientUserIds = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u1'];

    const result = await useCase.execute(new TrimNotificationsInputPort({ recipientUserIds }));

    expect(notificationRepository.countForRecipient).toHaveBeenCalledTimes(7);
    expect(result.processedRecipients).toBe(7);
  });

  it('deletes the oldest notifications above the per-user limit', async () => {
    const notificationRepository = mockPort<NotificationRepositoryPort>({
      countForRecipient: vi.fn().mockResolvedValue(NOTIFICATION_MAX_PER_USER + 2),
      findOldestNotificationIdsForTrim: vi.fn().mockResolvedValue(['n1', 'n2']),
      deleteNotificationsByIds: vi.fn().mockResolvedValue(2)
    });
    const useCase = new TrimNotificationsUseCase(notificationRepository);

    await useCase.execute(new TrimNotificationsInputPort({ recipientUserIds: ['u1'] }));

    expect(notificationRepository.findOldestNotificationIdsForTrim).toHaveBeenCalledWith({
      recipientId: 'u1',
      limit: 2
    });
    expect(notificationRepository.deleteNotificationsByIds).toHaveBeenCalledWith(['n1', 'n2']);
  });
});
