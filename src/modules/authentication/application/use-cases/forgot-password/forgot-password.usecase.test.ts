import { OtpServicePort } from '@/modules/authentication/application/services/otp.service';
import { ForgotPasswordInputPort } from '@/modules/authentication/application/use-cases/forgot-password/forgot-password.port';
import { ForgotPasswordUseCase } from '@/modules/authentication/application/use-cases/forgot-password/forgot-password.usecase';
import { OtpEntity } from '@/modules/authentication/domain/entities/otp.entity';
import { EnumOtpType } from '@/modules/authentication/domain/entities/otp.type';
import { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { makeUserFullProps } from '@test/support/builders/user.builder';
import { idDouble } from '@test/support/doubles/entity.double';
import { mockCache, mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const user = makeUserFullProps({ password: 'old-hash' });

describe('ForgotPasswordUseCase', () => {
  it('validates OTP, resets password, deletes OTP, and invalidates user cache', async () => {
    const otpEntity = idDouble('otp_1') as unknown as OtpEntity;
    const userRepository = mockPort<UserRepositoryPort>({
      resetPassword: vi.fn().mockResolvedValue(true)
    });
    const otpRepository = mockPort<OtpRepositoryPort>({
      deleteOtp: vi.fn().mockResolvedValue(otpEntity)
    });
    const hashingService = mockPort<HashingPort>({
      hash: vi.fn().mockResolvedValue('new-hash')
    });
    const userService = mockPort<UserServicePort>({
      findUserByEmail: vi.fn().mockResolvedValue(user)
    });
    const otpService = mockPort<OtpServicePort>({
      findAndValidateOtpCode: vi.fn().mockResolvedValue(otpEntity)
    });
    const cache = mockCache() as CacheStrategyPort;
    const useCase = new ForgotPasswordUseCase(
      userRepository,
      otpRepository,
      hashingService,
      userService,
      otpService,
      cache
    );

    const result = await useCase.execute(
      new ForgotPasswordInputPort({ email: 'Long@Example.com ', code: '123456', password: 'new-password' })
    );

    expect(result).toBe(true);
    expect(otpService.findAndValidateOtpCode).toHaveBeenCalledWith({
      email: user.email,
      code: '123456',
      type: EnumOtpType.FORGOT_PASSWORD
    });
    expect(userRepository.resetPassword).toHaveBeenCalledWith(user.id, { password: 'new-hash' });
    expect(otpRepository.deleteOtp).toHaveBeenCalledWith('otp_1');
    expect(cache.invalidate).toHaveBeenCalledWith(CACHE_KEYS.user(user.id));
  });
});
