import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import { ChangePasswordInputPort } from '@/modules/user/application/use-cases/change-password/change-password.port';
import { ChangePasswordUseCase } from '@/modules/user/application/use-cases/change-password/change-password.usecase';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { mockCache, mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

describe('ChangePasswordUseCase', () => {
  it('hashes the new password, stores it, and invalidates the user cache', async () => {
    const userRepository = mockPort<UserRepositoryPort>({
      changePassword: vi.fn().mockResolvedValue(null)
    });
    const hashingService = mockPort<HashingPort>({
      hash: vi.fn().mockResolvedValue('new-hash')
    });
    const cache = mockCache();
    const useCase = new ChangePasswordUseCase(userRepository, hashingService, cache);

    const result = await useCase.execute(new ChangePasswordInputPort({ userId: 'user_1', password: 'new-password' }));

    expect(result).toBe(true);
    expect(hashingService.hash).toHaveBeenCalledWith('new-password');
    expect(userRepository.changePassword).toHaveBeenCalledWith('user_1', { password: 'new-hash' });
    expect(cache.invalidate).toHaveBeenCalledWith(CACHE_KEYS.user('user_1'));
  });
});
