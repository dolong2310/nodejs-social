import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import {
  CannotEngagePostBlockedException,
  CannotEngageWithInaccessiblePostException,
  PostNotFoundException,
  StrangerCommentsNotAllowedException
} from '@/modules/post/application/exceptions/post.exception';
import {
  type CreatePostInputPort,
  CreatePostPort,
  CreatePostOutputPort
} from '@/modules/post/application/use-cases/create-post/create-post.port';
import type { HashtagEntity } from '@/modules/post/domain/entities/hashtag.entity';
import { EnumPostAudience, EnumPostType, type PostFullProps } from '@/modules/post/domain/entities/post.types';
import type { HashtagRepositoryPort } from '@/modules/post/domain/repositories/hashtag.repository';
import type { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import type { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import type { FriendServicePort } from '@/modules/relationship/application/services/friend.service';

export class CreatePostUseCase extends CreatePostPort {
  private readonly log: LoggerPort;

  constructor(
    private readonly postRepository: PostRepositoryPort,
    private readonly hashtagRepository: HashtagRepositoryPort,
    private readonly blockService: BlockServicePort,
    private readonly friendService: FriendServicePort,
    private readonly logger: LoggerPort
  ) {
    super();
    this.log = this.logger.child({ module: 'posts-service' });
  }

  async execute(input: CreatePostInputPort): Promise<CreatePostOutputPort> {
    const {
      userId,
      type,
      parentId,
      hashtags: hashtagsPayload,
      allowStrangerComments,
      audience,
      content,
      media,
      mentions
    } = input;
    // Check interaction permissions on the parent post before allowing comment/repost/quote creation.
    if (type !== EnumPostType.POST) {
      if (!parentId) {
        throw new PostNotFoundException();
      }
      // Load the parent post.
      const postEntity = await this.postRepository.findPostById(parentId);
      const parent = postEntity?.toObject();
      if (!parent) {
        throw new PostNotFoundException();
      }

      // Check two-way block status.
      if (await this.blockService.isBlockedEitherWay(userId, parent.userId)) {
        throw new CannotEngagePostBlockedException();
      }

      // Ensure the user is allowed to see the parent post.
      await this.assertUserCanSeeParentForInteraction(userId, parent);

      // Determine the user's relationship to the parent post.
      const ownerId = parent.userId;
      const isOwner = userId === ownerId; // parent post owner
      const isMention = parent.mentions.some((mentionId) => mentionId === userId); // tagged in the parent post
      // Apply the "stranger comments" rule only when the parent post is PUBLIC and user is a stranger.
      const isPublic = parent.audience === EnumPostAudience.PUBLIC;

      // If this flag is false and the new post type is COMMENT | REPOST | QUOTE, block with StrangerCommentsNotAllowedException.
      // For FRIENDS_ONLY posts, assertUserCanSeeParentForInteraction already ensures only friends/tagged users pass.
      if (isPublic && !isOwner && !isMention) {
        const allowStrangerComments = parent.allowStrangerComments ?? true;
        if (!allowStrangerComments) {
          const isFriend = await this.friendService.isFriendOf({ userId, otherUserId: ownerId }); // query only when enforcing the stranger rule
          if (!isFriend) {
            throw new StrangerCommentsNotAllowedException();
          }
        }
      }
    }

    // Create the new post.
    const hashtagEntities = await this.createHashtags(hashtagsPayload);
    const hashtagIds = hashtagEntities.filter((h) => h !== null).map((hashtag) => hashtag.id.toString());
    const postEntity = await this.postRepository.createPost({
      userId,
      type,
      parentId,
      content,
      audience,
      allowStrangerComments,
      media,
      mentions,
      hashtags: hashtagIds
    });
    const post = postEntity.toObject();
    return new CreatePostOutputPort(post);
  }

  private async createHashtags(hashtagsPayload: string[]): Promise<HashtagEntity[]> {
    // 1. Deduplicate input before bulkWrite to avoid duplicate tags.
    // 2. Normalize hashtags (trim/lowercase) before upsert to reduce fragmentation ("NodeJS" vs "nodejs").
    // 3. Limit the maximum hashtag count in validation to avoid abnormal requests creating oversized batches.
    const normalizedHashtags = [...new Set(hashtagsPayload.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
    if (normalizedHashtags.length === 0) {
      return Promise.resolve([]);
    }
    const hashtags = await this.hashtagRepository.insertBulk(normalizedHashtags);
    return hashtags;
  }

  /**
   * This method focuses only on parent post access.
   */
  private async assertUserCanSeeParentForInteraction(userId: string, parent: PostFullProps): Promise<void> {
    const ownerId = parent.userId;
    // If user owns the parent post (userId === ownerId), no access check is needed.
    if (userId === ownerId) {
      return;
    }
    // Check parent post access.
    const audienceStr = parent.audience as string;
    const isPublic = audienceStr === EnumPostAudience.PUBLIC;
    const isFriendsOnly = audienceStr === EnumPostAudience.FRIENDS_ONLY || audienceStr === 'followers';
    const isOnlyMe = audienceStr === EnumPostAudience.ONLY_ME || audienceStr === 'only_me';
    const isMention = parent.mentions.some((mentionId) => mentionId === userId);
    // ONLY_ME parent posts cannot be accessed by other users.
    if (isOnlyMe) {
      throw new CannotEngageWithInaccessiblePostException();
    }
    if (isPublic) {
      return;
    }
    // FRIENDS_ONLY parent posts allow access only for friends or users tagged in the parent post.
    if (isFriendsOnly && !isMention) {
      const isFriend = await this.friendService.isFriendOf({ userId, otherUserId: ownerId });
      if (isFriend) {
        return;
      }
      throw new CannotEngageWithInaccessiblePostException();
    }
    // If the parent post is neither PUBLIC nor FRIENDS_ONLY, deny access.
    if (!isPublic && !isFriendsOnly) {
      throw new CannotEngageWithInaccessiblePostException();
    }
  }
}
