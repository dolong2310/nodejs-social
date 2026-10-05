import { Paginated } from '@/modules/core/domain/repositories/port.repository';
import { AdminListUsersInputPort } from '@/modules/user/application/use-cases/admin-list-users/admin-list-users.port';
import { AdminListUsersUseCase } from '@/modules/user/application/use-cases/admin-list-users/admin-list-users.usecase';
import type { UserEntity } from '@/modules/user/domain/entities/user.entity';
import type { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { makeUserFullProps } from '@test/support/builders/user.builder';
import { entityDouble } from '@test/support/doubles/entity.double';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const user = makeUserFullProps({ password: 'hash' });

describe('AdminListUsersUseCase', () => {
  it('uses page and limit to query users and returns safe paginated items', async () => {
    const userRepository = mockPort<UserRepositoryPort>({
      findAllPaginated: vi.fn().mockResolvedValue(
        new Paginated({
          count: 1,
          page: 2,
          limit: 10,
          data: [entityDouble(user) as unknown as UserEntity]
        })
      )
    });
    const useCase = new AdminListUsersUseCase(userRepository);

    const result = await useCase.execute(new AdminListUsersInputPort({ page: 2, limit: 10 }));

    expect(userRepository.findAllPaginated).toHaveBeenCalledWith({
      page: 2,
      limit: 10,
      offset: 10,
      orderBy: { field: 'createdAt', param: 'desc' }
    });
    expect(result.total).toBe(1);
    expect(result.items[0]).toMatchObject({ id: user.id, email: user.email });
    expect(result.items[0]).not.toHaveProperty('password');
  });
});
