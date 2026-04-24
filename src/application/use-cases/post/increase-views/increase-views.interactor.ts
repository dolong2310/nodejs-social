import {
  IncreaseViewsCommand,
  IncreaseViewsInPort,
  IncreaseViewsResult
} from '@/application/use-cases/post/increase-views/increase-views.in-port';
import { PostRepositoryPort } from '@/domain/repositories/post/post.repository';

export class IncreaseViewsInteractor extends IncreaseViewsInPort {
  constructor(private readonly postRepository: PostRepositoryPort) {
    super();
  }

  async execute({ postId, userId }: IncreaseViewsCommand): Promise<IncreaseViewsResult | null> {
    const postEntity = await this.postRepository.increasePostViews({ postId, userId });
    const post = postEntity?.toObject();
    if (!post) return null;
    return new IncreaseViewsResult({
      userViews: post.userViews ?? 0,
      guestViews: post.guestViews ?? 0,
      updatedAt: post.updatedAt
    });
  }
}
