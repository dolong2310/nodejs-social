import { UserServicePort } from '@/modules/user/application/services/user.service';
import { GetMeInputPort } from '@/modules/user/application/use-cases/get-me/get-me.port';
import { GetMeUseCase } from '@/modules/user/application/use-cases/get-me/get-me.usecase';
import { makeUserSafeProps } from '@test/support/builders/user.builder';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const user = makeUserSafeProps();

describe('GetMeUseCase', () => {
  it('loads the current user through the safe user service path', async () => {
    const userService = mockPort<UserServicePort>({
      findUserById: vi.fn().mockResolvedValue(user)
    });
    const useCase = new GetMeUseCase(userService);

    const result = await useCase.execute(new GetMeInputPort({ userId: user.id }));

    expect(userService.findUserById).toHaveBeenCalledWith(user.id, { querySafe: true });
    expect(result).toMatchObject({ id: user.id, email: user.email, username: user.username });
  });
});
