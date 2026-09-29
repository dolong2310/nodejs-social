import { OtpServicePort } from '@/modules/authentication/application/services/otp.service';
import { Disable2FAInputPort } from '@/modules/authentication/application/use-cases/disable-2fa/disable-2fa.port';
import { Disable2FAUseCase } from '@/modules/authentication/application/use-cases/disable-2fa/disable-2fa.usecase';
import { EnumOtpType } from '@/modules/authentication/domain/entities/otp.type';
import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { makeUserFullProps } from '@test/support/builders/user.builder';
import { mockCache, mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const user = makeUserFullProps({ password: 'hashed', totpSecret: 'secret' });

describe('Disable2FAUseCase', () => {
  it('validates the provided code, removes the TOTP secret, and invalidates cache', async () => {
    const userRepository = mockPort<UserRepositoryPort>({
      updateOne: vi.fn().mockResolvedValue(undefined)
    });
    const userService = mockPort<UserServicePort>({
      findUserById: vi.fn().mockResolvedValue(user)
    });
    const otpService = mockPort<OtpServicePort>({
      validateTOTPCodeOrEmailOtpCode: vi.fn().mockResolvedValue(undefined)
    });
    const cache = mockCache() as CacheStrategyPort;
    const useCase = new Disable2FAUseCase(userRepository, userService, otpService, cache);

    const result = await useCase.execute(new Disable2FAInputPort({ userId: user.id, totpCode: '123456' }));

    expect(result).toBe(true);
    expect(otpService.validateTOTPCodeOrEmailOtpCode).toHaveBeenCalledWith({
      totpCode: '123456',
      emailOtpCode: undefined,
      totpSecret: 'secret',
      email: user.email,
      type: EnumOtpType.DISABLE_2FA
    });
    expect(userRepository.updateOne).toHaveBeenCalledWith(user.id, { totpSecret: null });
    expect(cache.invalidate).toHaveBeenCalledWith(CACHE_KEYS.user(user.id));
  });
});
