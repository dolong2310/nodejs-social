import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import {
  EmptyPostUpdateException,
  OnlyOwnerCanUpdatePostSettingsException,
  OnlyRootPostCanBeUpdatedException,
  PostNotFoundException
} from '@/modules/post/application/exceptions/post.exception';
import {
  UpdatePostCommand,
  UpdatePostPort,
  UpdatePostResult
} from '@/modules/post/application/use-cases/update-post/update-post.port';
import { HashtagEntity } from '@/modules/post/domain/entities/hashtag.entity';
import { EnumPostType } from '@/modules/post/domain/entities/post.type';
import { HashtagRepositoryPort } from '@/modules/post/domain/repositories/hashtag.repository';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';

export class UpdatePostUseCase extends UpdatePostPort {
  private readonly log: LoggerPort;

  constructor(
    private readonly postRepository: PostRepositoryPort,
    private readonly hashtagRepository: HashtagRepositoryPort,
    private readonly logger: LoggerPort
  ) {
    super();
    this.log = this.logger.child({ module: 'posts-service' });
  }

  async execute(command: UpdatePostCommand): Promise<UpdatePostResult> {
    const { userId, postId, audience, allowStrangerComments, content, media, mentions } = command;
    const postExistingEntity = await this.postRepository.findPostById(postId);

    if (!postExistingEntity) {
      throw new PostNotFoundException();
    }

    const postExisting = postExistingEntity.getProps();
    if (postExisting.userId !== userId) {
      throw new OnlyOwnerCanUpdatePostSettingsException();
    }

    if (postExisting.type !== EnumPostType.POST) {
      throw new OnlyRootPostCanBeUpdatedException();
    }

    if (!this.hasUpdatePayload(command)) {
      throw new EmptyPostUpdateException();
    }

    const hashtags = command.hashtags ? await this.createHashtagIds(command.hashtags) : undefined;

    const postEntity = await this.postRepository.updatePost({
      postId,
      ownerUserId: userId,
      audience,
      allowStrangerComments,
      content,
      media,
      mentions,
      hashtags
    });

    if (!postEntity) {
      throw new PostNotFoundException();
    }

    return new UpdatePostResult(postEntity.toObject());
  }

  private hasUpdatePayload(command: UpdatePostCommand): boolean {
    return (
      command.audience !== undefined ||
      command.allowStrangerComments !== undefined ||
      command.content !== undefined ||
      command.media !== undefined ||
      command.hashtags !== undefined ||
      command.mentions !== undefined
    );
  }

  private async createHashtagIds(hashtagsPayload: string[]): Promise<string[]> {
    const hashtagEntities = await this.createHashtags(hashtagsPayload);
    return hashtagEntities.filter((hashtag) => hashtag !== null).map((hashtag) => hashtag.id.toString());
  }

  private async createHashtags(hashtagsPayload: string[]): Promise<HashtagEntity[]> {
    const normalizedHashtags = [...new Set(hashtagsPayload.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
    if (normalizedHashtags.length === 0) {
      return Promise.resolve([]);
    }
    return this.hashtagRepository.insertBulk(normalizedHashtags);
  }
}
