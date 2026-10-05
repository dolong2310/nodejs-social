import {
  type IncreaseViewsInputPort,
  IncreaseViewsPort,
  IncreaseViewsOutputPort
} from '@/modules/post/application/use-cases/increase-views/increase-views.port';
import type { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';

export class IncreaseViewsUseCase extends IncreaseViewsPort {
  constructor(private readonly postRepository: PostRepositoryPort) {
    super();
  }

  async execute(input: IncreaseViewsInputPort): Promise<IncreaseViewsOutputPort | null> {
    const { postId, userId } = input;
    const postViews = await this.postRepository.increasePostViews({ postId, userId });
    if (!postViews) return null;
    return new IncreaseViewsOutputPort({
      userViews: postViews.userViews ?? 0,
      guestViews: postViews.guestViews ?? 0,
      updatedAt: postViews.updatedAt
    });
  }
}
