import { DeleteExpiredOtpsInputPort } from '@/modules/authentication/application/use-cases/delete-expired-otps/delete-expired-otps.port';
import { DeleteExpiredOtpsUseCase } from '@/modules/authentication/application/use-cases/delete-expired-otps/delete-expired-otps.usecase';
import type { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

describe('DeleteExpiredOtpsUseCase', () => {
  it('deletes expired OTP records at the requested time', async () => {
    const now = new Date('2026-01-01T00:00:00.000Z');
    const otpRepository = mockPort<OtpRepositoryPort>({
      deleteExpiredOtps: vi.fn().mockResolvedValue(3)
    });
    const useCase = new DeleteExpiredOtpsUseCase(otpRepository);

    const result = await useCase.execute(new DeleteExpiredOtpsInputPort(now));

    expect(otpRepository.deleteExpiredOtps).toHaveBeenCalledWith(now);
    expect(result.deletedCount).toBe(3);
  });
});
