import type { OtpEmailQueuePort } from '@/modules/authentication/application/ports/otp-email-job.port';
import { SendOtpInputPort } from '@/modules/authentication/application/use-cases/send-otp/send-otp.port';
import { SendOtpUseCase } from '@/modules/authentication/application/use-cases/send-otp/send-otp.usecase';
import type { OtpEntity } from '@/modules/authentication/domain/entities/otp.entity';
import { EnumOtpType } from '@/modules/authentication/domain/entities/otp.types';
import type { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import type { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { idDouble } from '@test/support/doubles/entity.double';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

describe('SendOtpUseCase', () => {
  it('creates a register OTP and queues the email job when the email is unused', async () => {
    const otpEntity = idDouble('otp_1') as unknown as OtpEntity;
    const otpRepository = mockPort<OtpRepositoryPort>({
      createOtp: vi.fn().mockResolvedValue(otpEntity)
    });
    const userRepository = mockPort<UserRepositoryPort>({
      findUserByEmail: vi.fn().mockResolvedValue(null)
    });
    const otpEmailQueue = mockPort<OtpEmailQueuePort>({
      add: vi.fn().mockResolvedValue(undefined)
    });
    const useCase = new SendOtpUseCase(otpRepository, userRepository, otpEmailQueue);

    await useCase.execute(
      new SendOtpInputPort({
        email: 'long@example.com',
        code: '000000',
        type: EnumOtpType.REGISTER,
        expiresAt: new Date()
      })
    );

    expect(userRepository.findUserByEmail).toHaveBeenCalledWith('long@example.com');
    expect(otpRepository.createOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'long@example.com', type: EnumOtpType.REGISTER })
    );
    expect(otpEmailQueue.add).toHaveBeenCalledWith({
      toAddress: 'long@example.com',
      subject: 'OTP Code',
      body: {
        code: expect.stringMatching(/^\d{6}$/),
        otpId: 'otp_1'
      }
    });
  });
});
