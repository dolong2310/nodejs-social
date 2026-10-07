import {
  type IncreasePostsViewsInputPort,
  IncreasePostsViewsPort,
  IncreasePostsViewsOutputPort
} from '@/modules/post/application/use-cases/increase-posts-views/increase-posts-views.port';
import type { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';

export class IncreasePostsViewsUseCase extends IncreasePostsViewsPort {
  constructor(private readonly postRepository: PostRepositoryPort) {
    super();
  }

  async execute(input: IncreasePostsViewsInputPort): Promise<IncreasePostsViewsOutputPort> {
    const postIds = [...new Set(input.postIds)];
    if (postIds.length === 0) {
      return new IncreasePostsViewsOutputPort({ updatedCount: 0 });
    }
    const updatedCount = await this.postRepository.increasePostsViews({
      ids: postIds,
      isAuthenticatedUser: input.isAuthenticatedUser
    });
    return new IncreasePostsViewsOutputPort({ updatedCount });
  }
}
