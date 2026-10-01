import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import {
  EmptyPostUpdateException,
  OnlyOwnerCanUpdatePostSettingsException,
  PostNotFoundException,
  RepostCannotBeUpdatedException
} from '@/modules/post/application/exceptions/post.exception';
import {
  UpdatePostInputPort,
  UpdatePostPort,
  UpdatePostOutputPort
} from '@/modules/post/application/use-cases/update-post/update-post.port';
import { HashtagEntity } from '@/modules/post/domain/entities/hashtag.entity';
import { EnumPostType } from '@/modules/post/domain/entities/post.types';
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

  async execute(input: UpdatePostInputPort): Promise<UpdatePostOutputPort> {
    const { userId, postId, audience, allowStrangerComments, content, media, mentions } = input;
    const postExistingEntity = await this.postRepository.findPostById(postId);

    if (!postExistingEntity) {
      throw new PostNotFoundException();
    }

    const postExisting = postExistingEntity.getProps();
    if (postExisting.userId !== userId) {
      throw new OnlyOwnerCanUpdatePostSettingsException();
    }

    if (postExisting.type === EnumPostType.REPOST) {
      throw new RepostCannotBeUpdatedException();
    }

    if (!this.hasUpdatePayload(input)) {
      throw new EmptyPostUpdateException();
    }

    const hashtags = input.hashtags ? await this.createHashtagIds(input.hashtags) : undefined;

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

    return new UpdatePostOutputPort(postEntity.toObject());
  }

  private hasUpdatePayload(input: UpdatePostInputPort): boolean {
    return (
      input.audience !== undefined ||
      input.allowStrangerComments !== undefined ||
      input.content !== undefined ||
      input.media !== undefined ||
      input.hashtags !== undefined ||
      input.mentions !== undefined
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
