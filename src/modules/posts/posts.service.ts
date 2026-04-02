import { CACHE_KEYS, CACHE_TTL } from '@/constants/cache.constant';
import { Injectable } from '@/decorators/injectable.decorator';
import { ICursorPaginationResult } from '@/interfaces/types/cursor.type';
import { BaseService } from '@/modules/base/base.service';
import { BlockRepository } from '@/modules/blocks/blocks.repository';
import { FriendsService } from '@/modules/friends/friends.service';
import {
  CreatePostRequestDTO,
  GetNewFeedsPayloadDTO,
  GetPostDetailParamsDTO,
  PatchPostRequestDTO
} from '@/modules/posts/dtos/posts.request.dto';
import { PostDetailResponseDTO, PostNewFeedResponseDTO } from '@/modules/posts/dtos/posts.response.dto';
import { EPostAudience, EPostType } from '@/modules/posts/posts.enum';
import {
  CannotEngagePostBlockedException,
  CannotEngageWithInaccessiblePostException,
  OnlyOwnerCanUpdatePostSettingsException,
  PostNotFoundException,
  StrangerCommentsNotAllowedException
} from '@/modules/posts/posts.exception';
import { PostRepository } from '@/modules/posts/posts.repository';
import { IPost } from '@/modules/posts/posts.schema';
import { RedisService } from '@/providers/database/redis/redis.service';
import { LoggerInstance } from '@/providers/logger/instance.logger';
import { PostViewsJobQueue } from '@/providers/queue/queues/post-views.queue';
import { CursorPaginationQueryDTO } from '@/shared/dtos/common.request.dto';
import { SharedInvalidCursorException } from '@/shared/exceptions/cursor.exception';
import { IHashtag } from '@/shared/models/hashtag.schema';
import { redactNewFeedAuthor, redactPostRowAuthorForBlock } from '@/utils/block-redaction.util';
import { decodeCursorOrThrow } from '@/utils/cursor-pagination.util';
import { decodePostFeedCursor, encodePostFeedCursor } from '@/utils/post-feed-cursor.util';

const log = LoggerInstance.getLogger().child({ module: 'posts-service' });
type GetPostsTypePayload = {
  userId?: string;
  postId: string;
  type: EPostType;
  cursor?: CursorPaginationQueryDTO['cursor'];
  limit: CursorPaginationQueryDTO['limit'];
};

export interface IPostsService {
  findPostDetail(postId: string): Promise<PostDetailResponseDTO | null>;
  getNewFeeds(payload: GetNewFeedsPayloadDTO): Promise<ICursorPaginationResult<PostNewFeedResponseDTO>>;
  getGuestNewFeeds(payload: CursorPaginationQueryDTO): Promise<ICursorPaginationResult<PostNewFeedResponseDTO>>;
  getPostsType(payload: GetPostsTypePayload): Promise<ICursorPaginationResult<PostDetailResponseDTO>>;
  findPostById(postId: string): Promise<IPost | null>;
  findAndUpsertHashtags(hashtags: string[]): Promise<(IHashtag | null)[]>;
  increaseViews(
    payload: GetPostDetailParamsDTO & {
      userId?: string;
    }
  ): Promise<Pick<IPost, 'userViews' | 'guestViews' | 'updatedAt'> | null>;
  createPost(payload: { userId: string; body: CreatePostRequestDTO }): Promise<IPost>;
  patchPostByOwner(payload: { userId: string; postId: string; body: PatchPostRequestDTO }): Promise<IPost>;
  updatePostsViews<T extends PostDetailResponseDTO | PostNewFeedResponseDTO>({
    posts,
    userId
  }: {
    posts: T[];
    userId?: string;
  }): Promise<T[]>;
  /** Like, bookmark, or comment on the given post (BLCK-02 / D-11). */
  hasViewerEngagedWithPost(viewerId: string, postId: string): Promise<boolean>;
  /** Post ids to include in feed/search when author is blocked but viewer had prior engagement (D-11). */
  getExtraVisiblePostIdsForBlockedEngagement(userId: string, blockedAuthorIds: string[]): Promise<string[]>;
  /** Block graph (either direction) with same short Redis TTL as feed — reuse for search. */
  listBlockedUserIdsEitherDirectionCached(userId: string): Promise<string[]>;
}

@Injectable()
export class PostsService extends BaseService implements IPostsService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly blockRepository: BlockRepository,
    private readonly friendsService: FriendsService,
    private readonly postViewsJobQueue: PostViewsJobQueue,
    private readonly redis: RedisService
  ) {
    super();
  }

  findPostDetail(postId: string) {
    return this.postRepository.findById(postId);
  }

  /**
   * Lấy danh sách bài viết mới nhất cho user đã đăng nhập
   * - Áp dụng luật chặn 2 chiều (ai block ai đều tính).
   * - Vẫn cho phép hiển thị một số bài của tác giả bị block nếu viewer đã từng tương tác trước đó (like/bookmark/comment) — nhưng ẩn danh tính tác giả.
   * - Cập nhật lượt xem cho các bài vừa load.
   */
  async getNewFeeds({
    userId,
    friendUserIds,
    cursor,
    limit
  }: GetNewFeedsPayloadDTO): Promise<ICursorPaginationResult<PostNewFeedResponseDTO>> {
    const numLimit = Number(limit);
    const before = decodeCursorOrThrow(cursor, decodePostFeedCursor, SharedInvalidCursorException);

    // Lấy danh sách user bị block liên quan đến viewer (cache ngắn hạn)
    const blockedAuthorIds = await this.getBlockedIdsCached(userId);

    // Loại chính userId ra khỏi danh sách block để dùng cho rule "engagement"
    const blockedForEngagement = blockedAuthorIds.filter((id) => id !== userId);

    // Nếu có blocked authors, lấy các post ID mà viewer đã tương tác
    const extraVisiblePostIds =
      blockedForEngagement.length > 0
        ? await this.getExtraVisiblePostIdsForBlockedEngagement(userId, blockedForEngagement)
        : [];

    // Lấy danh sách bài viết
    const rows = await this.postRepository.findPosts({
      userId,
      friendUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraVisiblePostIds.length > 0 ? extraVisiblePostIds : undefined,
      cursor: before,
      limit: numLimit
    });
    const hasMore = rows.length > numLimit;
    const posts = rows.slice(0, numLimit);

    // Với bài nào thuộc blocked author nhưng được "nới quyền xem" do đã tương tác trước đó
    const blockedIds = new Set(blockedForEngagement);
    for (const post of posts) {
      if (post.author && blockedIds.has(post.author._id.toHexString())) {
        // Ẩn danh tác giả (redactNewFeedAuthor(post) để thay author thành Unknown user)
        redactNewFeedAuthor(post);
      }
    }

    // tăng guestViews/userViews tương ứng và cập nhật updatedAt
    const updatedPosts = await this.updatePostsViews<PostNewFeedResponseDTO>({ posts, userId });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodePostFeedCursor(last.createdAt, last._id.toHexString()) : null;
    return { items: updatedPosts, nextCursor };
  }

  /**
   * Lấy danh sách bài viết mới nhất cho user chưa đăng nhập
   */
  async getGuestNewFeeds({
    cursor,
    limit
  }: CursorPaginationQueryDTO): Promise<ICursorPaginationResult<PostNewFeedResponseDTO>> {
    const numLimit = Number(limit);
    const before = decodeCursorOrThrow(cursor, decodePostFeedCursor, SharedInvalidCursorException);
    const rows = await this.postRepository.findGuestPosts({ cursor: before, limit: numLimit });
    const hasMore = rows.length > numLimit;
    const posts = rows.slice(0, numLimit);

    const updatedPosts = await this.updatePostsViews<PostNewFeedResponseDTO>({ posts });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodePostFeedCursor(last.createdAt, last._id.toHexString()) : null;
    return { items: updatedPosts, nextCursor };
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
  }: GetPostsTypePayload): Promise<ICursorPaginationResult<PostDetailResponseDTO>> {
    const numLimit = Number(limit);
    const before = decodeCursorOrThrow(cursor, decodePostFeedCursor, SharedInvalidCursorException);
    // Lấy danh sách bài viết theo postId và type.
    const rows = await this.postRepository.findPostsType({ postId, type, cursor: before, limit: numLimit });
    const hasMore = rows.length > numLimit;
    const posts = rows.slice(0, numLimit);

    if (userId) {
      // Lấy toàn bộ user có quan hệ block với viewer theo cả 2 chiều (viewer block họ hoặc họ block viewer).
      const blockedIds = await this.getBlockedIdsCached(userId);
      if (blockedIds.length > 0) {
        // Kiểm tra viewer đã từng tương tác post cha chưa (like/bookmark/comment).
        const engaged = await this.postRepository.hasViewerEngagedWithPost(userId, postId);
        if (engaged) {
          const blockedHex = new Set(blockedIds);
          for (const p of posts) {
            if (blockedHex.has(p.userId.toHexString())) {
              // Ẩn thông tin tác giả của từng row bị block (đổi sang “Unknown user” sentinel), giữ nội dung post.
              redactPostRowAuthorForBlock(p);
            }
          }
        }
      }
    }

    // Cập nhật lượt xem cho các bài vừa load.
    const updatedPosts = await this.updatePostsViews<PostDetailResponseDTO>({ posts, userId });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodePostFeedCursor(last.createdAt, last._id.toHexString()) : null;
    return { items: updatedPosts, nextCursor };
  }

  /**
   * Kiểm tra người xem (viewerId) đã từng tương tác với bài viết (postId) hay chưa.
   * Trả về true/false để dùng cho rule quyền xem trong các tình huống block.
   */
  hasViewerEngagedWithPost(viewerId: string, postId: string): Promise<boolean> {
    return this.postRepository.hasViewerEngagedWithPost(viewerId, postId);
  }

  /**
   * Dù tác giả bài viết đang bị block,
   * nếu người xem (userId) đã từng tương tác với bài của những tác giả đó (like/bookmark/comment)
   * thì vẫn lấy ra danh sách post id để có thể hiển thị thêm theo rule "blocked-engagement exception".
   */
  async getExtraVisiblePostIdsForBlockedEngagement(userId: string, blockedAuthorIds: string[]): Promise<string[]> {
    const authors = blockedAuthorIds.filter((id) => id !== userId).sort();
    if (authors.length === 0) {
      return [];
    }
    const key = CACHE_KEYS.blockedEngagementPostIds({ userId, blockedAuthorIds: authors });
    return this.redis.getOrSet(
      key,
      () => this.postRepository.findPostIdsWhereViewerEngagedWithAuthors(userId, authors),
      CACHE_TTL.BLOCKED_ENGAGEMENT_POST_IDS
    );
  }

  /**
   * Lấy danh sách user đang có quan hệ block với viewer và cache ngắn hạn bằng Redis.
   * - Tránh query DB lặp lại nhiều lần khi load feed/bài viết.
   * - Chuẩn hóa dữ liệu “block hai chiều”: gồm cả người dùng mà viewer block và người block lại viewer.
   * - Dùng cho logic ẩn/che thông tin bài viết liên quan block (ở flow lấy posts).
   */
  private getBlockedIdsCached(userId: string): Promise<string[]> {
    const key = CACHE_KEYS.blockedUserIds({ userId });
    return this.redis.getOrSet(
      key,
      () => this.blockRepository.listUserIdsBlockedInEitherDirection(userId),
      CACHE_TTL.BLOCKED_USER_IDS
    );
  }

  listBlockedUserIdsEitherDirectionCached(userId: string): Promise<string[]> {
    return this.getBlockedIdsCached(userId);
  }

  findPostById(postId: string): Promise<IPost | null> {
    return this.postRepository.findPostById(postId);
  }

  findAndUpsertHashtags(hashtags: string[]): Promise<(IHashtag | null)[]> {
    // 1. Deduplicate input trước khi bulkWrite để tránh duplicate tags.
    // 2. Normalize hashtag (trim/lowercase) trước khi upsert để giảm phân mảnh dữ liệu ("NodeJS" vs "nodejs").
    // 3. Giới hạn số hashtag tối đa ở validation (hiện chưa thấy limit), tránh request bất thường làm batch quá lớn.
    const normalizedHashtags = [...new Set(hashtags.map((tag) => tag.trim().toLowerCase()).filter(Boolean))];
    if (normalizedHashtags.length === 0) {
      return Promise.resolve([]);
    }
    return this.postRepository.findAndUpsertHashtags(normalizedHashtags);
  }

  increaseViews({
    postId,
    userId
  }: GetPostDetailParamsDTO & {
    userId?: string;
  }): Promise<Pick<IPost, 'userViews' | 'guestViews' | 'updatedAt'> | null> {
    return this.postRepository.findOneAndUpdate(
      { postId, userId },
      { returnDocument: 'after', projection: { userViews: 1, guestViews: 1, updatedAt: 1 } }
    );
  }

  async createPost({ userId, body }: { userId: string; body: CreatePostRequestDTO }): Promise<IPost> {
    if (body.type !== EPostType.POST) {
      await this.assertThreadedEngagementAllowed(userId, body);
    }

    const hashtags = (await this.findAndUpsertHashtags(body.hashtags)).filter((h) => h !== null);
    const hashtagIds = hashtags.map((hashtag) => hashtag._id);
    const newPost = await this.postRepository.createPost({ userId, body: { ...body, hashtags: hashtagIds } });
    return newPost;
  }

  async patchPostByOwner({
    userId,
    postId,
    body
  }: {
    userId: string;
    postId: string;
    body: PatchPostRequestDTO;
  }): Promise<IPost> {
    const existing = await this.postRepository.findPostById(postId);
    if (!existing) {
      throw PostNotFoundException;
    }
    if (existing.userId.toHexString() !== userId) {
      throw OnlyOwnerCanUpdatePostSettingsException;
    }
    const updated = await this.postRepository.updatePostAudienceAndStrangerComments(postId, userId, {
      audience: body.audience,
      allowStrangerComments: body.allowStrangerComments
    });
    if (!updated) {
      throw PostNotFoundException;
    }
    return updated;
  }

  async updatePostsViews<T extends PostDetailResponseDTO | PostNewFeedResponseDTO>({
    posts,
    userId
  }: {
    posts: T[];
    userId?: string;
  }): Promise<T[]> {
    if (posts.length === 0) {
      return posts;
    }
    const date = new Date();
    void this.postViewsJobQueue
      .add({
        postIds: posts.map((post) => post._id.toHexString()),
        isAuthenticatedViewer: Boolean(userId)
      })
      .catch((err: unknown) => {
        log.warn({ err }, 'enqueue post views job failed');
      });

    // update post with new views
    return posts.map((post) => ({
      ...post,
      updatedAt: date,
      userViews: userId ? post.userViews + 1 : post.userViews,
      guestViews: userId ? post.guestViews : post.guestViews + 1
    }));
  }

  /**
   * xử lý quyền tương tác vào bài cha trước khi cho tạo comment/repost/quote
   */
  private async assertThreadedEngagementAllowed(viewerId: string, body: CreatePostRequestDTO): Promise<void> {
    const parentId = body.parentId;
    if (!parentId) {
      throw PostNotFoundException;
    }
    // lấy bài post cha
    const parent = await this.postRepository.findPostById(parentId);
    if (!parent) {
      throw PostNotFoundException;
    }

    // Kiểm tra block 2 chiều
    if (await this.blockRepository.isBlockedEitherWay(viewerId, parent.userId.toHexString())) {
      throw CannotEngagePostBlockedException;
    }

    // chắc chắn người dùng được phép nhìn thấy bài cha
    await this.assertViewerCanSeeParentForEngagement(viewerId, parent);

    // Xác định vai trò người tương tác với bài cha
    const ownerId = parent.userId.toString();
    const isOwner = viewerId === ownerId; // chính chủ bài cha
    const isMention = parent.mentions.some((m) => m.toString() === viewerId); // được tag trong bài cha
    const audienceStr = parent.audience as string;
    // Chỉ xử lý rule "stranger comments" khi bài cha là PUBLIC và viewer là stranger.
    const isPublic = audienceStr === EPostAudience.PUBLIC;
    if (!isPublic) {
      return;
    }

    // Nếu flag này là false và post type tạo mới nằm trong COMMENT | REPOST | QUOTE thì chặn bằng StrangerCommentsNotAllowedException.
    const allowStrangerEngagement = parent.allowStrangerComments ?? true;
    const isEngagementType = [EPostType.COMMENT, EPostType.REPOST, EPostType.QUOTE].includes(body.type);
    if (allowStrangerEngagement || !isEngagementType || isOwner || isMention) {
      return;
    }
    const isFriend = await this.friendsService.isFriendOf(viewerId, ownerId); // chỉ query khi cần enforce stranger rule
    if (!isFriend) {
      throw StrangerCommentsNotAllowedException;
    }
  }

  /**
   * Hàm con này chỉ tập trung vào khả năng truy cập bài cha
   */
  private async assertViewerCanSeeParentForEngagement(viewerId: string, parent: IPost): Promise<void> {
    const ownerId = parent.userId.toString();
    // Nếu viewer là chủ bài cha (viewerId === ownerId) thì không cần kiểm tra quyền truy cập.
    if (viewerId === ownerId) {
      return;
    }
    // Kiểm tra quyền truy cập bài cha
    const audienceStr = parent.audience as string;
    const isPublic = audienceStr === EPostAudience.PUBLIC;
    const isFriendsOnly = audienceStr === EPostAudience.FRIENDS_ONLY || audienceStr === 'followers';
    const isOnlyMe = audienceStr === EPostAudience.ONLY_ME || audienceStr === 'only_me';
    const isMention = parent.mentions.some((m) => m.toString() === viewerId);
    // Nếu bài cha là ONLY_ME thì không cho phép truy cập.
    if (isOnlyMe) {
      throw CannotEngageWithInaccessiblePostException;
    }
    if (isPublic) {
      return;
    }
    // Nếu bài cha là FRIENDS_ONLY thì chỉ cho phép truy cập nếu là bạn bè hoặc được tag trong bài cha.
    if (isFriendsOnly && !isMention) {
      const isFriend = await this.friendsService.isFriendOf(viewerId, ownerId);
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
