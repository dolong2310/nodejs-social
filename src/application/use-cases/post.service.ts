import { IPost } from '@/domain/entities/post.entity';
import { EPostAudience, EPostType } from '@/domain/enums/posts.enum';
import { IBlockRepository } from '@/domain/repositories/block/block.repository';
import { IPostRepository } from '@/domain/repositories/post/post.repository';

import { CACHE_KEYS, CACHE_TTL } from '@/application/common/constants/cache.constant';
import { decodeCursorOrThrow } from '@/application/common/cursor-codec/cursor-decoder.codec';
import { decodePostFeedCursor, encodePostFeedCursor } from '@/application/common/cursor-codec/post-feed.cursor-codec';
import {
  transformUnknownAuthor,
  transformUnknownAuthorForPostDetail
} from '@/application/common/utils/transform-unknown-user.util';
import { CursorPaginationQueryDTO } from '@/application/dtos/common/common.payload.dto';
import {
  CreatePostPayloadDTO,
  FindAndUpsertHashtagsPayloadDTO,
  FindPostByIdPayloadDTO,
  FindPostDetailPayloadDTO,
  GetExtraVisiblePostIdsForBlockedEngagementPayloadDTO,
  GetNewFeedsPayloadDTO,
  GetPostsTypePayloadDTO,
  IncreaseViewsPayloadDTO,
  IsViewerInteractedWithPostPayloadDTO,
  ListBlockedUserIdsEitherDirectionCachedPayloadDTO,
  PatchPostPayloadDTO,
  UpdatePostsViewsPayloadDTO
} from '@/application/dtos/post/post.payload.dto';
import {
  FindAndUpsertHashtagsResultDTO,
  GetExtraVisiblePostIdsForBlockedEngagementResultDTO,
  IncrementViewsResultDTO,
  IsViewerInteractedWithPostResultDTO,
  ListBlockedUserIdsEitherDirectionCachedResultDTO,
  PostDetailPaginationResultDTO,
  PostDetailResultDTO,
  PostNewFeedPaginationResultDTO,
  PostNewFeedResultDTO,
  PostResultDTO
} from '@/application/dtos/post/post.result.dto';
import { SharedInvalidCursorException } from '@/application/errors/pagination.error';
import {
  CannotEngagePostBlockedException,
  CannotEngageWithInaccessiblePostException,
  OnlyFriendsCanViewPostsException,
  OnlyOwnerCanUpdatePostSettingsException,
  PostNotFoundException,
  StrangerCommentsNotAllowedException
} from '@/application/errors/post.error';
import { IFriendsService } from '@/application/ports/friend.port';
import { ILogger } from '@/application/ports/logger.port';
import { IPostViewsQueue } from '@/application/ports/post-views-job.port';
import { IPostsService } from '@/application/ports/post.port';
import { IRedisService } from '@/application/ports/redis.port';
import { BaseService } from '@/application/use-cases/base.service';

export class PostsService extends BaseService implements IPostsService {
  private readonly log: ILogger;

  constructor(
    private readonly postRepository: IPostRepository,
    private readonly blockRepository: IBlockRepository,
    private readonly friendsService: IFriendsService,
    private readonly postViewsJobQueue: IPostViewsQueue,
    private readonly redis: IRedisService,
    private readonly logger: ILogger
  ) {
    super();
    this.log = this.logger.child({ module: 'posts-service' });
  }

  /**
   * Lấy danh sách bài viết mới nhất cho user đã đăng nhập
   * - Áp dụng luật chặn 2 chiều (ai block ai đều tính).
   * - Vẫn cho phép hiển thị một số bài của tác giả bị block nếu viewer đã từng tương tác trước đó (like/bookmark/comment) — nhưng ẩn danh tính tác giả.
   * - Cập nhật lượt xem cho các bài vừa load.
   */
  async getNewFeeds({ userId, cursor, limit }: GetNewFeedsPayloadDTO): Promise<PostNewFeedPaginationResultDTO> {
    const before = decodeCursorOrThrow(cursor, decodePostFeedCursor, SharedInvalidCursorException);

    // Same DTO field name as before; values are mutual friend ids from friendships collection.
    const { friendUserIds } = await this.friendsService.findFriendUserIds({ userId });

    // Lấy danh sách user bị block liên quan đến viewer (cache ngắn hạn)
    const blockedAuthorIds = await this.getBlockedIdsCached(userId);

    // Loại chính userId ra khỏi danh sách block để dùng cho rule "engagement"
    const blockedForEngagement = blockedAuthorIds.filter((id) => id !== userId);

    // Nếu có blocked authors, lấy các post ID mà viewer đã tương tác
    const { extraVisiblePostIds } =
      blockedForEngagement.length > 0
        ? await this.getExtraVisiblePostIdsForBlockedEngagement({ userId, blockedAuthorIds: blockedForEngagement })
        : new GetExtraVisiblePostIdsForBlockedEngagementResultDTO([]);

    // Lấy danh sách bài viết
    const rows = await this.postRepository.findPosts({
      userId,
      friendUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraVisiblePostIds.length > 0 ? extraVisiblePostIds : undefined,
      cursor: before,
      limit
    });
    const hasMore = rows.length > limit;
    const posts = rows.slice(0, limit);

    // Với bài nào thuộc blocked author nhưng được "nới quyền xem" do đã tương tác trước đó
    const blockedIds = new Set(blockedForEngagement);
    for (const post of posts) {
      if (post.author && blockedIds.has(post.author.id)) {
        // Ẩn danh tác giả (thay thế author thành Unknown user)
        transformUnknownAuthor(post);
      }
    }

    // tăng guestViews/userViews tương ứng và cập nhật updatedAt
    const updatedPosts = this.updatePostsViews<PostNewFeedResultDTO>({ posts, userId });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodePostFeedCursor(last.createdAt, last.id) : null;
    return new PostNewFeedPaginationResultDTO({ items: updatedPosts, nextCursor });
  }

  /**
   * Lấy danh sách bài viết mới nhất cho user chưa đăng nhập
   */
  async getGuestNewFeeds({ cursor, limit }: CursorPaginationQueryDTO): Promise<PostNewFeedPaginationResultDTO> {
    const before = decodeCursorOrThrow(cursor, decodePostFeedCursor, SharedInvalidCursorException);
    const rows = await this.postRepository.findGuestPosts({ cursor: before, limit });
    const hasMore = rows.length > limit;
    const posts = rows.slice(0, limit);

    const updatedPosts = this.updatePostsViews<PostNewFeedResultDTO>({ posts });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodePostFeedCursor(last.createdAt, last.id) : null;
    return new PostNewFeedPaginationResultDTO({ items: updatedPosts, nextCursor });
  }

  async findPostDetail({ postId }: FindPostDetailPayloadDTO): Promise<PostDetailResultDTO | null> {
    const post = await this.postRepository.findPostDetailById({ postId });
    if (!post) {
      return null;
    }
    return new PostDetailResultDTO(post);
  }

  async increaseViews({ postId, userId }: IncreaseViewsPayloadDTO): Promise<IncrementViewsResultDTO | null> {
    const updated = await this.postRepository.increasePostViews({ postId, userId });
    if (!updated) {
      return null;
    }
    return new IncrementViewsResultDTO({
      userViews: updated.userViews,
      guestViews: updated.guestViews,
      updatedAt: updated.updatedAt
    });
  }

  /**
   * Lấy danh sách post con theo loại (ví dụ comment/repost/quote) của một postId
   * - nếu có đang đăng nhập:
   * - lấy danh sách user đang block 2 chiều với viewer.
   * - nếu có block, kiểm tra viewer có từng tương tác với post cha không.
   * - nếu có tương tác, những post của tác giả bị block vẫn hiển thị nhưng ẩn danh tác giả (redact).
   */
  async getPostsType({
    userId,
    cursor,
    limit,
    postId,
    type
  }: GetPostsTypePayloadDTO): Promise<PostDetailPaginationResultDTO> {
    const before = decodeCursorOrThrow(cursor, decodePostFeedCursor, SharedInvalidCursorException);
    // Lấy danh sách bài viết theo postId và type.
    const rows = await this.postRepository.findPostsType({ postId, type, cursor: before, limit });
    const hasMore = rows.length > limit;
    const posts = rows.slice(0, limit);

    if (userId) {
      // Lấy toàn bộ user có quan hệ block với viewer theo cả 2 chiều (viewer block họ hoặc họ block viewer).
      const blockedIds = await this.getBlockedIdsCached(userId);
      if (blockedIds.length > 0) {
        // Kiểm tra viewer đã từng tương tác post cha chưa (like/bookmark/comment).
        const engaged = await this.postRepository.isViewerInteractedWithPost({ viewerId: userId, postId });
        if (engaged) {
          const blockedHex = new Set(blockedIds);
          for (const post of posts) {
            if (blockedHex.has(post.userId)) {
              // Ẩn thông tin tác giả của từng row bị block (thay thế thành “Unknown user”), giữ nội dung post.
              transformUnknownAuthorForPostDetail(post);
            }
          }
        }
      }
    }

    // Cập nhật lượt xem cho các bài vừa load.
    const updatedPosts = this.updatePostsViews<PostDetailResultDTO>({ posts, userId });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodePostFeedCursor(last.createdAt, last.id) : null;
    return new PostDetailPaginationResultDTO({ items: updatedPosts, nextCursor });
  }

  async createPost({
    userId,
    type,
    parentId,
    hashtags: hashtagsPayload,
    allowStrangerComments,
    audience,
    content,
    media,
    mentions
  }: CreatePostPayloadDTO): Promise<PostResultDTO> {
    // xử lý quyền tương tác vào bài cha trước khi cho tạo comment/repost/quote
    if (type !== EPostType.POST) {
      if (!parentId) {
        throw PostNotFoundException;
      }
      // lấy bài post cha
      const parent = await this.postRepository.findPostById({ postId: parentId });
      if (!parent) {
        throw PostNotFoundException;
      }

      // Kiểm tra block 2 chiều
      if (await this.blockRepository.isBlockedEitherWay({ aUserId: userId, bUserId: parent.userId })) {
        throw CannotEngagePostBlockedException;
      }

      // chắc chắn người dùng được phép nhìn thấy bài cha
      await this.assertViewerCanSeeParentForInteraction(userId, parent);

      // Xác định vai trò người tương tác với bài cha
      const ownerId = parent.userId;
      const isOwner = userId === ownerId; // chính chủ bài cha
      const isMention = parent.mentions.some((mentionId) => mentionId === userId); // được tag trong bài cha
      const audienceStr = parent.audience as string;
      // Chỉ xử lý rule "stranger comments" khi bài cha là PUBLIC và viewer là stranger.
      const isPublic = audienceStr === EPostAudience.PUBLIC;
      if (!isPublic) {
        throw OnlyFriendsCanViewPostsException;
      }

      // Nếu flag này là false và post type tạo mới nằm trong COMMENT | REPOST | QUOTE thì chặn bằng StrangerCommentsNotAllowedException.
      const allowStrangerEngagement = parent.allowStrangerComments ?? true;
      const isEngagementType = [EPostType.COMMENT, EPostType.REPOST, EPostType.QUOTE].includes(type);
      if (allowStrangerEngagement || !isEngagementType || isOwner || isMention) {
        throw StrangerCommentsNotAllowedException;
      }
      const isFriend = await this.friendsService.isFriendOf({ viewerUserId: userId, otherUserId: ownerId }); // chỉ query khi cần enforce stranger rule
      if (!isFriend) {
        throw StrangerCommentsNotAllowedException;
      }
    }

    // tạo post mới
    const { hashtags } = await this.findAndUpsertHashtags({ hashtags: hashtagsPayload });
    const hashtagIds = hashtags.filter((h) => h !== null).map((hashtag) => hashtag.id);
    const newPost = await this.postRepository.createPost({
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
    return new PostResultDTO(newPost);
  }

  async patchPost({ userId, postId, audience, allowStrangerComments }: PatchPostPayloadDTO): Promise<PostResultDTO> {
    const existing = await this.postRepository.findPostById({ postId });
    if (!existing) {
      throw PostNotFoundException;
    }
    if (existing.userId !== userId) {
      throw OnlyOwnerCanUpdatePostSettingsException;
    }
    const updated = await this.postRepository.updatePostAudienceAndStrangerComments({
      postId,
      ownerUserId: userId,
      audience,
      allowStrangerComments
    });
    if (!updated) {
      throw PostNotFoundException;
    }
    return new PostResultDTO(updated);
  }

  async findPostById({ postId }: FindPostByIdPayloadDTO): Promise<PostResultDTO | null> {
    const post = await this.postRepository.findPostById({ postId });
    if (!post) {
      return null;
    }
    return new PostResultDTO(post);
  }

  /**
   * Kiểm tra người xem (viewerId) đã từng tương tác với bài viết (postId) hay chưa.
   * Trả về true/false để dùng cho rule quyền xem trong các tình huống block.
   */
  async isViewerInteractedWithPost({
    viewerId,
    postId
  }: IsViewerInteractedWithPostPayloadDTO): Promise<IsViewerInteractedWithPostResultDTO> {
    const isInteracted = await this.postRepository.isViewerInteractedWithPost({ viewerId, postId });
    return new IsViewerInteractedWithPostResultDTO(isInteracted);
  }

  /**
   * Dù tác giả bài viết đang bị block,
   * nếu người xem (userId) đã từng tương tác với bài của những tác giả đó (like/bookmark/comment)
   * thì vẫn lấy ra danh sách post id để có thể hiển thị thêm theo rule "blocked-engagement exception".
   */
  async getExtraVisiblePostIdsForBlockedEngagement({
    userId,
    blockedAuthorIds
  }: GetExtraVisiblePostIdsForBlockedEngagementPayloadDTO): Promise<GetExtraVisiblePostIdsForBlockedEngagementResultDTO> {
    const authors = blockedAuthorIds.filter((id) => id !== userId).sort();
    if (authors.length === 0) {
      return new GetExtraVisiblePostIdsForBlockedEngagementResultDTO([]);
    }
    const key = CACHE_KEYS.blockedEngagementPostIds({ userId, blockedAuthorIds: authors });
    const { ids: extraVisiblePostIds } = await this.redis.getOrSet(
      key,
      () => this.postRepository.findPostIdsWhereViewerInteractedWithAuthors({ viewerId: userId, authorIds: authors }),
      CACHE_TTL.BLOCKED_ENGAGEMENT_POST_IDS
    );

    return new GetExtraVisiblePostIdsForBlockedEngagementResultDTO(extraVisiblePostIds);
  }

  async listBlockedUserIdsEitherDirectionCached({
    userId
  }: ListBlockedUserIdsEitherDirectionCachedPayloadDTO): Promise<ListBlockedUserIdsEitherDirectionCachedResultDTO> {
    const blockedUserIds = await this.getBlockedIdsCached(userId);
    return new ListBlockedUserIdsEitherDirectionCachedResultDTO(blockedUserIds);
  }

  updatePostsViews<T extends PostDetailResultDTO | PostNewFeedResultDTO>({
    posts,
    userId
  }: UpdatePostsViewsPayloadDTO<T>): T[] {
    if (posts.length === 0) {
      return posts;
    }
    const date = new Date();
    void this.postViewsJobQueue
      .add({
        postIds: posts.map((post) => post.id),
        isAuthenticatedViewer: Boolean(userId)
      })
      .catch((err: unknown) => {
        this.log.warn({ err }, 'enqueue post views job failed');
      });

    // update post with new views
    return posts.map((post) => ({
      ...post,
      updatedAt: date,
      userViews: userId ? post.userViews + 1 : post.userViews,
      guestViews: userId ? post.guestViews : post.guestViews + 1
    }));
  }

  private async findAndUpsertHashtags({
    hashtags: hashtagsPayload
  }: FindAndUpsertHashtagsPayloadDTO): Promise<FindAndUpsertHashtagsResultDTO> {
    // 1. Deduplicate input trước khi bulkWrite để tránh duplicate tags.
    // 2. Normalize hashtag (trim/lowercase) trước khi upsert để giảm phân mảnh dữ liệu ("NodeJS" vs "nodejs").
    // 3. Giới hạn số hashtag tối đa ở validation (hiện chưa thấy limit), tránh request bất thường làm batch quá lớn.
    const normalizedHashtags = [...new Set(hashtagsPayload.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
    if (normalizedHashtags.length === 0) {
      return Promise.resolve(new FindAndUpsertHashtagsResultDTO([]));
    }
    const hashtags = await this.postRepository.findAndUpsertHashtags({ hashtags: normalizedHashtags });
    return new FindAndUpsertHashtagsResultDTO(hashtags);
  }

  /**
   * Lấy danh sách user đang có quan hệ block với viewer và cache ngắn hạn bằng Redis.
   * - Tránh query DB lặp lại nhiều lần khi load feed/bài viết.
   * - Chuẩn hóa dữ liệu “block hai chiều”: gồm cả người dùng mà viewer block và người block lại viewer.
   * - Dùng cho logic ẩn/che thông tin bài viết liên quan block (ở flow lấy posts).
   */
  private async getBlockedIdsCached(userId: string): Promise<string[]> {
    const key = CACHE_KEYS.blockedUserIds({ userId });
    const { ids } = await this.redis.getOrSet(
      key,
      () => this.blockRepository.listUserIdsBlockedInEitherDirection({ viewerUserId: userId }),
      CACHE_TTL.BLOCKED_USER_IDS
    );
    return ids;
  }

  /**
   * Hàm này chỉ tập trung vào khả năng truy cập bài cha
   */
  private async assertViewerCanSeeParentForInteraction(viewerId: string, parent: IPost): Promise<void> {
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
      throw CannotEngageWithInaccessiblePostException;
    }
    if (isPublic) {
      return;
    }
    // Nếu bài cha là FRIENDS_ONLY thì chỉ cho phép truy cập nếu là bạn bè hoặc được tag trong bài cha.
    if (isFriendsOnly && !isMention) {
      const isFriend = await this.friendsService.isFriendOf({ viewerUserId: viewerId, otherUserId: ownerId });
      if (isFriend) {
        return;
      }
      throw CannotEngageWithInaccessiblePostException;
    }
    // Nếu bài cha không phải là PUBLIC hoặc FRIENDS_ONLY thì không cho phép truy cập.
    if (!isPublic && !isFriendsOnly) {
      throw CannotEngageWithInaccessiblePostException;
    }
  }
}
