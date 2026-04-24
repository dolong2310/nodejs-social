import {
  OnlyOwnerCanUpdatePostSettingsException,
  PostNotFoundException
} from '@/application/exceptions/post.exception';
import { LoggerPort } from '@/application/ports/logger.port';
import {
  UpdatePostCommand,
  UpdatePostInPort,
  UpdatePostResult
} from '@/application/use-cases/post/update-post/update-post.in-port';
import { PostRepositoryPort } from '@/domain/repositories/post/post.repository';

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
      throw PostNotFoundException;
    }

    if (postExisting.userId !== userId) {
      throw OnlyOwnerCanUpdatePostSettingsException;
    }

    const postEntity = await this.postRepository.updatePostAudienceAndStrangerComments({
      postId,
      ownerUserId: userId,
      audience,
      allowStrangerComments
    });

    if (!postEntity) {
      throw PostNotFoundException;
    }

    return new UpdatePostResult(postEntity.toObject());
  }
}
