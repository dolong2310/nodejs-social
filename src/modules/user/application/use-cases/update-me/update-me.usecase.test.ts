import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { UpdateMeInputPort } from '@/modules/user/application/use-cases/update-me/update-me.port';
import { UpdateMeUseCase } from '@/modules/user/application/use-cases/update-me/update-me.usecase';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { makeUserFullProps, makeUserSafeProps } from '@test/support/builders/user.builder';
import { entityDouble } from '@test/support/doubles/entity.double';
import { mockCache, mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const currentUser = makeUserFullProps({ name: 'Old Name', username: 'oldname' });
const updatedUser = makeUserFullProps({ ...currentUser, name: 'New Name', username: 'newname' });
const existingUsernameOwner = makeUserSafeProps({ id: currentUser.id, username: updatedUser.username });

describe('UpdateMeUseCase', () => {
  it('updates profile fields and invalidates user and username cache keys', async () => {
    const userRepository = mockPort<UserRepositoryPort>({
      updateMe: vi.fn().mockResolvedValue(entityDouble(updatedUser) as unknown as UserEntity)
    });
    const userService = mockPort<UserServicePort>({
      findUserById: vi.fn().mockResolvedValue(currentUser),
      findUserByUsername: vi.fn().mockResolvedValue(existingUsernameOwner)
    });
    const cache = mockCache() as CacheStrategyPort;
    const useCase = new UpdateMeUseCase(userRepository, userService, cache);

    const result = await useCase.execute(
      new UpdateMeInputPort({
        userId: currentUser.id,
        name: ' New Name ',
        username: ' NewName ',
        birthday: '1995-01-01'
      })
    );

    expect(userRepository.updateMe).toHaveBeenCalledWith(
      currentUser.id,
      expect.objectContaining({
        name: updatedUser.name,
        username: updatedUser.username,
        birthday: new Date('1995-01-01')
      })
    );
    expect(cache.invalidate).toHaveBeenCalledWith(CACHE_KEYS.user(currentUser.id));
    expect(cache.invalidate).toHaveBeenCalledWith(CACHE_KEYS.userByUsername(currentUser.username ?? ''));
    expect(cache.invalidate).toHaveBeenCalledWith(CACHE_KEYS.userByUsername(updatedUser.username ?? ''));
    expect(result).toMatchObject({ id: updatedUser.id, name: updatedUser.name, username: updatedUser.username });
  });
});
