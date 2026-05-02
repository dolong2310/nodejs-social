import { PostCommandRepositoryPort } from '@/modules/post/application/ports/command/post-command.repository';
import {
  IncreaseViewsCommand,
  IncreaseViewsInPort,
  IncreaseViewsResult
} from '@/modules/post/application/use-cases/increase-views/increase-views.in-port';

export class IncreaseViewsInteractor extends IncreaseViewsInPort {
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
