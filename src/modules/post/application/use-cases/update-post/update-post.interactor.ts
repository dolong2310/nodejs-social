import {
  OnlyOwnerCanUpdatePostSettingsException,
  PostNotFoundException
} from '@/modules/post/application/post.exception';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import {
  UpdatePostCommand,
  UpdatePostInPort,
  UpdatePostResult
} from '@/modules/post/application/use-cases/update-post/update-post.in-port';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';

export class UpdatePostInteractor extends UpdatePostInPort {
  private readonly log: LoggerPort;

  constructor(
    private readonly postRepository: PostRepositoryPort,
    private readonly logger: LoggerPort
  ) {
    super();
    this.log = this.logger.child({ module: 'posts-service' });
  }

  async execute({ userId, postId, audience, allowStrangerComments }: UpdatePostCommand): Promise<UpdatePostResult> {
    const postExistingEntity = await this.postRepository.findPostById(postId);
    const postExisting = postExistingEntity?.toObject();

    if (!postExisting) {
      throw new PostNotFoundException();
    }

    if (postExisting.userId !== userId) {
      throw new OnlyOwnerCanUpdatePostSettingsException();
    }

    const postEntity = await this.postRepository.updatePostAudienceAndStrangerComments({
      postId,
      ownerUserId: userId,
      audience,
      allowStrangerComments
    });

    if (!postEntity) {
      throw new PostNotFoundException();
    }

    return new UpdatePostResult(postEntity.toObject());
  }
}
