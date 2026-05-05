import { PostCommandRepositoryPort } from '@/modules/post/application/ports/command/post-command.repository';
import {
  IncreaseViewsCommand,
  IncreaseViewsPort,
  IncreaseViewsResult
} from '@/modules/post/application/use-cases/increase-views/increase-views.port';

export class IncreaseViewsUseCase extends IncreaseViewsPort {
  constructor(private readonly postCommandRepository: PostCommandRepositoryPort) {
    super();
  }

  async execute({ postId, userId }: IncreaseViewsCommand): Promise<IncreaseViewsResult | null> {
    const postViews = await this.postCommandRepository.increasePostViews({ postId, userId });
    if (!postViews) return null;
    return new IncreaseViewsResult({
      userViews: postViews.userViews ?? 0,
      guestViews: postViews.guestViews ?? 0,
      updatedAt: postViews.updatedAt
    });
  }
}
