import { TwoFactorAuthPort } from '@/modules/authentication/application/ports/2fa.port';
import { Setup2FACommand } from '@/modules/authentication/application/use-cases/setup-2fa/setup-2fa.port';
import { Setup2FAUseCase } from '@/modules/authentication/application/use-cases/setup-2fa/setup-2fa.usecase';
import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { makeUserFullProps } from '@test/support/builders/user.builder';
import { mockCache, mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const user = makeUserFullProps({ password: 'hash' });

describe('Setup2FAUseCase', () => {
  it('generates and persists a TOTP secret for a user without 2FA', async () => {
    const userRepository = mockPort<UserRepositoryPort>({
      updateOne: vi.fn().mockResolvedValue(undefined)
    });
    const userService = mockPort<UserServicePort>({
      findUserById: vi.fn().mockResolvedValue(user)
    });
    const twoFactorAuthenticationService = mockPort<TwoFactorAuthPort>({
      generateSecret: vi.fn().mockReturnValue({ secret: 'secret', uri: 'otpauth://totp/social' })
    });
    const cache = mockCache() as CacheStrategyPort;
    const useCase = new Setup2FAUseCase(userRepository, userService, twoFactorAuthenticationService, cache);

    const result = await useCase.execute(new Setup2FACommand({ userId: user.id }));

    expect(twoFactorAuthenticationService.generateSecret).toHaveBeenCalledWith(user.email);
    expect(userRepository.updateOne).toHaveBeenCalledWith(user.id, { totpSecret: 'secret' });
    expect(cache.invalidate).toHaveBeenCalledWith(CACHE_KEYS.user(user.id));
    expect(result).toEqual({ secret: 'secret', uri: 'otpauth://totp/social' });
  });
});
