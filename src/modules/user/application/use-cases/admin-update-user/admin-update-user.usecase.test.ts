import { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import { RoleEntity } from '@/modules/authorization/domain/entities/role.entity';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { AdminUpdateUserInputPort } from '@/modules/user/application/use-cases/admin-update-user/admin-update-user.port';
import { AdminUpdateUserUseCase } from '@/modules/user/application/use-cases/admin-update-user/admin-update-user.usecase';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { makeUserFullProps } from '@test/support/builders/user.builder';
import { entityDouble } from '@test/support/doubles/entity.double';
import { mockCache, mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const currentUser = makeUserFullProps({
  name: 'Old Name',
  email: 'old@example.com',
  password: 'old-hash',
  username: 'oldname'
});
const updatedUser = makeUserFullProps({ ...currentUser, name: 'New Name', username: 'newname' });

describe('AdminUpdateUserUseCase', () => {
  it('updates a non-admin user and invalidates old and new user cache keys', async () => {
    const userRepository = mockPort<UserRepositoryPort>({
      findUserById: vi.fn().mockResolvedValue(entityDouble(currentUser) as unknown as UserEntity),
      update: vi.fn().mockResolvedValue(entityDouble(updatedUser) as unknown as UserEntity)
    });
    const userService = mockPort<UserServicePort>({
      findUserByUsername: vi.fn().mockResolvedValue(null)
    });
    const roleRepository = mockPort<RoleRepositoryPort>({
      findRoleById: vi.fn().mockResolvedValue({} as RoleEntity)
    });
    const roleService = mockPort<RoleServicePort>({
      getAdminRoleId: vi.fn().mockResolvedValue('role_admin')
    });
    const hashingService = mockPort<HashingPort>({
      hash: vi.fn().mockResolvedValue('new-hash')
    });
    const cache = mockCache() as CacheStrategyPort;
    const useCase = new AdminUpdateUserUseCase(
      userRepository,
      userService,
      roleRepository,
      roleService,
      hashingService,
      cache
    );

    const result = await useCase.execute(
      new AdminUpdateUserInputPort({
        actorId: 'admin_1',
        userId: currentUser.id,
        name: updatedUser.name,
        password: 'new-password',
        roleId: currentUser.roleId,
        username: updatedUser.username
      })
    );

    expect(roleRepository.findRoleById).toHaveBeenCalledWith(currentUser.roleId);
    expect(hashingService.hash).toHaveBeenCalledWith('new-password');
    expect(userRepository.update).toHaveBeenCalledWith(
      currentUser.id,
      expect.objectContaining({ name: updatedUser.name, password: 'new-hash', username: updatedUser.username }),
      { actorId: 'admin_1' }
    );
    expect(cache.invalidate).toHaveBeenCalledWith(CACHE_KEYS.user(currentUser.id));
    expect(cache.invalidate).toHaveBeenCalledWith(CACHE_KEYS.userByUsername(currentUser.username ?? ''));
    expect(cache.invalidate).toHaveBeenCalledWith(CACHE_KEYS.userByUsername(updatedUser.username ?? ''));
    expect(result).toMatchObject({ id: updatedUser.id, name: updatedUser.name });
    expect(result).not.toHaveProperty('password');
  });
});
