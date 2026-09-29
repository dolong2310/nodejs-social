import { AdminGetUserInputPort } from '@/modules/user/application/use-cases/admin-get-user/admin-get-user.port';
import { AdminGetUserUseCase } from '@/modules/user/application/use-cases/admin-get-user/admin-get-user.usecase';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { makeUserFullProps } from '@test/support/builders/user.builder';
import { entityDouble } from '@test/support/doubles/entity.double';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const user = makeUserFullProps({ password: 'hash' });

describe('AdminGetUserUseCase', () => {
  it('returns safe user data for an existing user', async () => {
    const userRepository = mockPort<UserRepositoryPort>({
      findUserById: vi.fn().mockResolvedValue(entityDouble(user) as unknown as UserEntity)
    });
    const useCase = new AdminGetUserUseCase(userRepository);

    const result = await useCase.execute(new AdminGetUserInputPort(user.id));

    expect(userRepository.findUserById).toHaveBeenCalledWith(user.id);
    expect(result).toMatchObject({ id: user.id, email: user.email });
    expect(result).not.toHaveProperty('password');
  });
});
