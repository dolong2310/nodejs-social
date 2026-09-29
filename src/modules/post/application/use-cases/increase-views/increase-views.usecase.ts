import {
  IncreaseViewsInputPort,
  IncreaseViewsPort,
  IncreaseViewsOutputPort
} from '@/modules/post/application/use-cases/increase-views/increase-views.port';
import { PostCommandRepositoryPort } from '@/modules/post/domain/repositories/post.command.repository';

export class IncreaseViewsUseCase extends IncreaseViewsPort {
  constructor(private readonly postCommandRepository: PostCommandRepositoryPort) {
    super();
  }

  async execute(input: IncreaseViewsInputPort): Promise<IncreaseViewsOutputPort | null> {
    const { postId, userId } = input;
    const postViews = await this.postCommandRepository.increasePostViews({ postId, userId });
    if (!postViews) return null;
    return new IncreaseViewsOutputPort({
      userViews: postViews.userViews ?? 0,
      guestViews: postViews.guestViews ?? 0,
      updatedAt: postViews.updatedAt
    });
  }
}
