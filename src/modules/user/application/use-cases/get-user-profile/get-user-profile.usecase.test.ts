import type { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import type { UserServicePort } from '@/modules/user/application/services/user.service';
import { GetUserProfileInputPort } from '@/modules/user/application/use-cases/get-user-profile/get-user-profile.port';
import { GetUserProfileUseCase } from '@/modules/user/application/use-cases/get-user-profile/get-user-profile.usecase';
import { makeUserSafeProps } from '@test/support/builders/user.builder';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

const user = makeUserSafeProps({
  id: 'user_2',
  name: 'Profile User',
  email: 'profile@example.com',
  username: 'profile'
});

describe('GetUserProfileUseCase', () => {
  it('returns a public profile when the viewer is not blocked either way', async () => {
    const userService = mockPort<UserServicePort>({
      findUserByUsername: vi.fn().mockResolvedValue(user)
    });
    const blockService = mockPort<BlockServicePort>({
      isBlockedEitherWay: vi.fn().mockResolvedValue(false)
    });
    const useCase = new GetUserProfileUseCase(userService, blockService);

    const result = await useCase.execute(new GetUserProfileInputPort({ userId: 'viewer_1', username: 'Profile' }));

    expect(userService.findUserByUsername).toHaveBeenCalledWith('Profile', { querySafe: true });
    expect(blockService.isBlockedEitherWay).toHaveBeenCalledWith('viewer_1', user.id);
    expect(result).toMatchObject({ id: user.id, email: user.email, username: user.username });
  });
});
