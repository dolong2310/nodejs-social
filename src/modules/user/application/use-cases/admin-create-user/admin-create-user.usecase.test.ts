import { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import { RoleEntity } from '@/modules/authorization/domain/entities/role.entity';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { AdminCreateUserCommand } from '@/modules/user/application/use-cases/admin-create-user/admin-create-user.port';
import { AdminCreateUserUseCase } from '@/modules/user/application/use-cases/admin-create-user/admin-create-user.usecase';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { EnumUserStatus } from '@/modules/user/domain/entities/user.type';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { makeUserFullProps } from '@test/support/builders/user.builder';
import { entityDouble } from '@test/support/doubles/entity.double';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const createdUser = makeUserFullProps({
  name: 'Created User',
  email: 'created@example.com',
  password: 'hashed-password',
  username: 'created'
});

describe('AdminCreateUserUseCase', () => {
  it('creates a non-admin user with a hashed password and returns safe user data', async () => {
    const userRepository = mockPort<UserRepositoryPort>({
      insert: vi.fn().mockResolvedValue(entityDouble(createdUser) as unknown as UserEntity)
    });
    const userService = mockPort<UserServicePort>({
      findUserByEmail: vi.fn().mockResolvedValue(null),
      findUserByUsername: vi.fn().mockResolvedValue(null)
    });
    const roleRepository = mockPort<RoleRepositoryPort>({
      findRoleById: vi.fn().mockResolvedValue({} as RoleEntity)
    });
    const roleService = mockPort<RoleServicePort>({
      getAdminRoleId: vi.fn().mockResolvedValue('role_admin')
    });
    const hashingService = mockPort<HashingPort>({
      hash: vi.fn().mockResolvedValue('hashed-password')
    });
    const useCase = new AdminCreateUserUseCase(
      userRepository,
      userService,
      roleRepository,
      roleService,
      hashingService
    );

    const result = await useCase.execute(
      new AdminCreateUserCommand({
        actorId: 'admin_1',
        name: createdUser.name,
        email: createdUser.email,
        password: 'password',
        birthday: createdUser.birthday,
        roleId: createdUser.roleId,
        status: EnumUserStatus.ACTIVE,
        username: createdUser.username
      })
    );

    expect(roleRepository.findRoleById).toHaveBeenCalledWith(createdUser.roleId);
    expect(hashingService.hash).toHaveBeenCalledWith('password');
    expect(userRepository.insert).toHaveBeenCalledWith(expect.any(UserEntity), { actorId: 'admin_1' });
    expect(result).toMatchObject({ id: createdUser.id, email: createdUser.email });
    expect(result).not.toHaveProperty('password');
  });
});
