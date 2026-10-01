import { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constants';
import { AdminDeleteUserInputPort } from '@/modules/user/application/use-cases/admin-delete-user/admin-delete-user.port';
import { AdminDeleteUserUseCase } from '@/modules/user/application/use-cases/admin-delete-user/admin-delete-user.usecase';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { makeUserFullProps } from '@test/support/builders/user.builder';
import { entityDouble } from '@test/support/doubles/entity.double';
import { mockCache, mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const user = makeUserFullProps({
  name: 'Regular User',
  email: 'user@example.com',
  password: 'hash',
  username: 'regular'
});

describe('AdminDeleteUserUseCase', () => {
  it('deletes a non-admin user and invalidates id and username cache keys', async () => {
    const userRepository = mockPort<UserRepositoryPort>({
      findUserById: vi.fn().mockResolvedValue(entityDouble(user) as unknown as UserEntity),
      deleteById: vi.fn().mockResolvedValue(true)
    });
    const roleService = mockPort<RoleServicePort>({
      getAdminRoleId: vi.fn().mockResolvedValue('role_admin')
    });
    const cache = mockCache();
    const useCase = new AdminDeleteUserUseCase(userRepository, roleService, cache);

    await useCase.execute(new AdminDeleteUserInputPort({ actorId: 'admin_1', userId: user.id }));

    expect(userRepository.deleteById).toHaveBeenCalledWith(user.id, { actorId: 'admin_1' });
    expect(cache.invalidate).toHaveBeenCalledWith(CACHE_KEYS.user(user.id));
    expect(cache.invalidate).toHaveBeenCalledWith(CACHE_KEYS.userByUsername(user.username ?? ''));
  });
});
