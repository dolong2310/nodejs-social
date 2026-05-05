import {
  CannotEngagePostBlockedException,
  CannotEngageWithInaccessiblePostException,
  PostNotFoundException,
  StrangerCommentsNotAllowedException
} from '@/modules/post/application/post.exception';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { BlockServicePort } from '@/modules/block/application/services/block.service';
import { FriendServicePort } from '@/modules/friend/application/services/friend.service';
import {
  CreatePostCommand,
  CreatePostInPort,
  CreatePostResult
} from '@/modules/post/application/use-cases/create-post/create-post.in-port';
import { HashtagEntity } from '@/modules/hashtag/domain/entities/hashtag.entity';
import { EPostAudience, EPostType, PostFullProps } from '@/modules/post/domain/entities/post.type';
import { HashtagRepositoryPort } from '@/modules/hashtag/domain/repositories/hashtag.repository';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';

export class CreatePostInteractor extends CreatePostInPort {
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

  async execute({
    userId,
    type,
    parentId,
    hashtags: hashtagsPayload,
    allowStrangerComments,
    audience,
    content,
    media,
    mentions
  }: CreatePostCommand): Promise<CreatePostResult> {
    // xử lý quyền tương tác vào bài cha trước khi cho tạo comment/repost/quote
    if (type !== EPostType.POST) {
      if (!parentId) {
        throw new PostNotFoundException();
      }
      // lấy bài post cha
      const postEntity = await this.postRepository.findPostById(parentId);
      const parent = postEntity?.toObject();
      if (!parent) {
        throw new PostNotFoundException();
      }

      // Kiểm tra block 2 chiều
      if (await this.blockService.isBlockedEitherWay(userId, parent.userId)) {
        throw new CannotEngagePostBlockedException();
      }

      // chắc chắn người dùng được phép nhìn thấy bài cha
      await this.assertViewerCanSeeParentForInteraction(userId, parent);

      // Xác định vai trò người tương tác với bài cha
      const ownerId = parent.userId;
      const isOwner = userId === ownerId; // chính chủ bài cha
      const isMention = parent.mentions.some((mentionId) => mentionId === userId); // được tag trong bài cha
      // Chỉ xử lý rule "stranger comments" khi bài cha là PUBLIC và viewer là stranger.
      const isPublic = parent.audience === EPostAudience.PUBLIC;

      // Nếu flag này là false và post type tạo mới nằm trong COMMENT | REPOST | QUOTE thì chặn bằng StrangerCommentsNotAllowedException.
      // Với bài FRIENDS_ONLY, assertViewerCanSeeParentForInteraction đã đảm bảo chỉ bạn bè/được tag mới qua được.
      if (isPublic && !isOwner && !isMention) {
        const allowStrangerComments = parent.allowStrangerComments ?? true;
        if (!allowStrangerComments) {
          const isFriend = await this.friendService.isFriendOf({ userId, otherUserId: ownerId }); // chỉ query khi cần enforce stranger rule
          if (!isFriend) {
            throw new StrangerCommentsNotAllowedException();
          }
        }
      }
    }

    // tạo post mới
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
    return new CreatePostResult(post);
  }

  private async createHashtags(hashtagsPayload: string[]): Promise<HashtagEntity[]> {
    // 1. Deduplicate input trước khi bulkWrite để tránh duplicate tags.
    // 2. Normalize hashtag (trim/lowercase) trước khi upsert để giảm phân mảnh dữ liệu ("NodeJS" vs "nodejs").
    // 3. Giới hạn số hashtag tối đa ở validation (hiện chưa thấy limit), tránh request bất thường làm batch quá lớn.
    const normalizedHashtags = [...new Set(hashtagsPayload.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
    if (normalizedHashtags.length === 0) {
      return Promise.resolve([]);
    }
    const hashtags = await this.hashtagRepository.insertBulk(normalizedHashtags);
    return hashtags;
  }

  /**
   * Hàm này chỉ tập trung vào khả năng truy cập bài cha
   */
  private async assertViewerCanSeeParentForInteraction(viewerId: string, parent: PostFullProps): Promise<void> {
    const ownerId = parent.userId;
    // Nếu viewer là chủ bài cha (viewerId === ownerId) thì không cần kiểm tra quyền truy cập.
    if (viewerId === ownerId) {
      return;
    }
    // Kiểm tra quyền truy cập bài cha
    const audienceStr = parent.audience as string;
    const isPublic = audienceStr === EPostAudience.PUBLIC;
    const isFriendsOnly = audienceStr === EPostAudience.FRIENDS_ONLY || audienceStr === 'followers';
    const isOnlyMe = audienceStr === EPostAudience.ONLY_ME || audienceStr === 'only_me';
    const isMention = parent.mentions.some((mentionId) => mentionId === viewerId);
    // Nếu bài cha là ONLY_ME thì không cho phép truy cập.
    if (isOnlyMe) {
      throw new CannotEngageWithInaccessiblePostException();
    }
    if (isPublic) {
      return;
    }
    // Nếu bài cha là FRIENDS_ONLY thì chỉ cho phép truy cập nếu là bạn bè hoặc được tag trong bài cha.
    if (isFriendsOnly && !isMention) {
      const isFriend = await this.friendService.isFriendOf({ userId: viewerId, otherUserId: ownerId });
      if (isFriend) {
        return;
      }
      throw new CannotEngageWithInaccessiblePostException();
    }
    // Nếu bài cha không phải là PUBLIC hoặc FRIENDS_ONLY thì không cho phép truy cập.
    if (!isPublic && !isFriendsOnly) {
      throw new CannotEngageWithInaccessiblePostException();
    }
  }
}
