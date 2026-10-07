import { IncreasePostsViewsInputPort } from '@/modules/post/application/use-cases/increase-posts-views/increase-posts-views.port';
import { IncreasePostsViewsUseCase } from '@/modules/post/application/use-cases/increase-posts-views/increase-posts-views.usecase';
import type { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import { mockPort } from '@test/support/mocks/port.mock';
import { describe, expect, it, vi } from 'vitest';

describe('IncreasePostsViewsUseCase', () => {
  it('increases views once per distinct post id', async () => {
    const postRepository = mockPort<PostRepositoryPort>({
      increasePostsViews: vi.fn().mockResolvedValue(2)
    });
    const useCase = new IncreasePostsViewsUseCase(postRepository);

    const result = await useCase.execute(
      new IncreasePostsViewsInputPort({ postIds: ['p1', 'p2', 'p1'], isAuthenticatedUser: true })
    );

    expect(postRepository.increasePostsViews).toHaveBeenCalledWith({ ids: ['p1', 'p2'], isAuthenticatedUser: true });
    expect(result.updatedCount).toBe(2);
  });

  it('skips the repository when there are no post ids', async () => {
    const postRepository = mockPort<PostRepositoryPort>({ increasePostsViews: vi.fn() });
    const useCase = new IncreasePostsViewsUseCase(postRepository);

    const result = await useCase.execute(new IncreasePostsViewsInputPort({ postIds: [], isAuthenticatedUser: false }));

    expect(postRepository.increasePostsViews).not.toHaveBeenCalled();
    expect(result.updatedCount).toBe(0);
  });
});
