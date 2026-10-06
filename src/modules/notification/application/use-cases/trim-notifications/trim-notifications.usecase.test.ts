import type { NotificationServicePort } from '@/modules/notification/application/services/notification.service';
import { TrimNotificationsInputPort } from '@/modules/notification/application/use-cases/trim-notifications/trim-notifications.port';
import { TrimNotificationsUseCase } from '@/modules/notification/application/use-cases/trim-notifications/trim-notifications.usecase';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

describe('TrimNotificationsUseCase', () => {
  it('trims each distinct recipient once', async () => {
    const notificationService = mockPort<NotificationServicePort>({
      trimRecipientIfNeeded: vi.fn().mockResolvedValue(undefined)
    });
    const useCase = new TrimNotificationsUseCase(notificationService);
    const recipientUserIds = ['u1', 'u2', 'u3', 'u4', 'u5', 'u6', 'u7', 'u1'];

    const result = await useCase.execute(new TrimNotificationsInputPort({ recipientUserIds }));

    expect(notificationService.trimRecipientIfNeeded).toHaveBeenCalledTimes(7);
    expect(result.processedRecipients).toBe(7);
  });
});
