import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { PaginationQueryDTO } from '@/dtos/requests/common.request.dto';
import {
  CreatePostRequestDTO,
  GetNewFeedsPayloadDTO,
  GetPostDetailParamsDTO,
  GetPostsParamsDTO,
  PatchPostRequestDTO
} from '@/dtos/requests/post.request.dto';
import { PostDetailResponseDTO, PostNewFeedResponseDTO } from '@/dtos/responses/post.response.dto';
import { EPostAudience, EPostType } from '@/enums/posts.enum';
import { IHashtag } from '@/models/hashtag.schema';
import { IPost } from '@/models/post.schema';
import { IBlockRepository } from '@/repositories/block.repository';
import { IPostRepository } from '@/repositories/post.repository';
import { ForbiddenError, NotFoundError } from '@/responses/error.response';
import { BaseService } from '@/services/base.service';
import { IFriendsService } from '@/services/friends.service';
import { redactNewFeedAuthor, redactPostRowAuthorForBlock } from '@/utils/block-redaction.util';
import { ObjectId } from 'mongodb';

export interface IPostsService {
  findPostDetail(postId: string): Promise<PostDetailResponseDTO | null>;
  getNewFeeds(payload: GetNewFeedsPayloadDTO): Promise<{ posts: PostNewFeedResponseDTO[]; totalPosts: number }>;
  getGuestNewFeeds(payload: PaginationQueryDTO): Promise<{ posts: PostNewFeedResponseDTO[]; totalPosts: number }>;
  getPostsType(
    payload: GetPostsParamsDTO &
      PaginationQueryDTO & {
        userId?: string;
      }
  ): Promise<{ posts: PostDetailResponseDTO[]; totalPosts: number }>;
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
  getExtraVisiblePostIdsForBlockedEngagement(userId: string, blockedAuthorIds: ObjectId[]): Promise<ObjectId[]>;
}

class PostsService extends BaseService implements IPostsService {
  constructor(
    private readonly postRepository: IPostRepository,
    private readonly blockRepository: IBlockRepository,
    private readonly friendsService: IFriendsService
  ) {
    super();
  }

  findPostDetail(postId: string) {
    return this.postRepository.findById(postId);
  }

  async getNewFeeds({ userId, followedUserIds, page, limit }: GetNewFeedsPayloadDTO) {
    const viewerOid = new ObjectId(userId);
    const blockedAuthorIds = await this.blockRepository.listUserIdsBlockedInEitherDirection(viewerOid);
    const blockedForEngagement = blockedAuthorIds.filter((id) => !id.equals(viewerOid));
    const extraVisiblePostIds =
      blockedForEngagement.length > 0
        ? await this.postRepository.findPostIdsWhereViewerEngagedWithAuthors(viewerOid, blockedForEngagement)
        : [];
    const postsPromise = this.postRepository.findPosts({
      userId,
      followedUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraVisiblePostIds.length > 0 ? extraVisiblePostIds : undefined,
      page: Number(page),
      limit: Number(limit)
    });
    const totalPostsPromise = this.postRepository.countPosts({
      userId,
      followedUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraVisiblePostIds.length > 0 ? extraVisiblePostIds : undefined
    });
    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    const blockedHex = new Set(blockedForEngagement.map((b) => b.toHexString()));
    for (const post of posts) {
      if (blockedHex.has(post.author._id.toHexString())) {
        redactNewFeedAuthor(post);
      }
    }

    const updatedPosts = await this.updatePostsViews<PostNewFeedResponseDTO>({ posts });

    return { posts: updatedPosts, totalPosts };
  }

  async getGuestNewFeeds({ page, limit }: PaginationQueryDTO) {
    const postsPromise = this.postRepository.findGuestPosts({ page: Number(page), limit: Number(limit) });
    const totalPostsPromise = this.postRepository.countGuestPosts();
    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    const updatedPosts = await this.updatePostsViews<PostNewFeedResponseDTO>({ posts });

    return { posts: updatedPosts, totalPosts };
  }

  async getPostsType({
    userId,
    page,
    limit,
    postId,
    type
  }: GetPostsParamsDTO &
    PaginationQueryDTO & {
      userId?: string;
    }) {
    const postsPromise = this.postRepository.findPostsType({ postId, type, page: Number(page), limit: Number(limit) });
    const totalPostsPromise = this.postRepository.countPostsType({ postId, type });
    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    if (userId) {
      const viewerOid = new ObjectId(userId);
      const blockedIds = await this.blockRepository.listUserIdsBlockedInEitherDirection(viewerOid);
      if (blockedIds.length > 0) {
        const engaged = await this.postRepository.hasViewerEngagedWithPost(viewerOid, new ObjectId(postId));
        if (engaged) {
          const blockedHex = new Set(blockedIds.map((b) => b.toHexString()));
          for (const p of posts) {
            if (blockedHex.has(p.userId.toHexString())) {
              redactPostRowAuthorForBlock(p);
            }
          }
        }
      }
    }

    const updatedPosts = await this.updatePostsViews<PostDetailResponseDTO>({ posts, userId });

    return { posts: updatedPosts, totalPosts };
  }

  hasViewerEngagedWithPost(viewerId: string, postId: string): Promise<boolean> {
    return this.postRepository.hasViewerEngagedWithPost(new ObjectId(viewerId), new ObjectId(postId));
  }

  async getExtraVisiblePostIdsForBlockedEngagement(userId: string, blockedAuthorIds: ObjectId[]): Promise<ObjectId[]> {
    const viewerOid = new ObjectId(userId);
    const authors = blockedAuthorIds.filter((id) => !id.equals(viewerOid));
    if (authors.length === 0) {
      return [];
    }
    return this.postRepository.findPostIdsWhereViewerEngagedWithAuthors(viewerOid, authors);
  }

  findPostById(postId: string): Promise<IPost | null> {
    return this.postRepository.findPostById(postId);
  }

  findAndUpsertHashtags(hashtags: string[]): Promise<(IHashtag | null)[]> {
    return this.postRepository.findAndUpsertHashtags(hashtags);
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

    const { hashtags: hashtagsBody } = body;

    const hashtags = (await this.findAndUpsertHashtags(hashtagsBody)).filter((h) => h !== null);
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
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND);
    }
    if (!existing.userId.equals(new ObjectId(userId))) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.ONLY_OWNER_CAN_UPDATE_POST_SETTINGS);
    }
    const updated = await this.postRepository.updatePostAudienceAndStrangerComments(postId, userId, {
      audience: body.audience,
      allowStrangerComments: body.allowStrangerComments
    });
    if (!updated) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND);
    }
    return updated;
  }

  private async assertThreadedEngagementAllowed(viewerId: string, body: CreatePostRequestDTO): Promise<void> {
    const parentId = body.parentId;
    if (!parentId) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND);
    }
    const parent = await this.postRepository.findPostById(parentId);
    if (!parent) {
      throw new NotFoundError(VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND);
    }
    if (await this.blockRepository.isBlockedEitherWay(new ObjectId(viewerId), parent.userId)) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CANNOT_ENGAGE_POST_BLOCKED);
    }
    await this.assertViewerCanSeeParentForEngagement(viewerId, parent);

    const ownerId = parent.userId.toString();
    const isOwner = viewerId === ownerId;
    const isFriend = await this.friendsService.isFriendOf(viewerId, ownerId);
    const isMention = parent.mentions.map((m) => m.toString()).includes(viewerId);
    const isStranger = !isOwner && !isFriend && !isMention;
    const audienceStr = parent.audience as string;
    const isPublic = audienceStr === EPostAudience.PUBLIC;
    if (!isPublic || !isStranger) {
      return;
    }
    const allowStrangerEngagement = parent.allowStrangerComments ?? true;
    if (!allowStrangerEngagement && [EPostType.COMMENT, EPostType.REPOST, EPostType.QUOTE].includes(body.type)) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.STRANGER_COMMENTS_NOT_ALLOWED_ON_THIS_POST);
    }
  }

  private async assertViewerCanSeeParentForEngagement(viewerId: string, parent: IPost): Promise<void> {
    const ownerId = parent.userId.toString();
    if (viewerId === ownerId) {
      return;
    }
    const audienceStr = parent.audience as string;
    const isPublic = audienceStr === EPostAudience.PUBLIC;
    const isFriendsOnly = audienceStr === EPostAudience.FRIENDS_ONLY || audienceStr === 'followers';
    const isOnlyMe = audienceStr === EPostAudience.ONLY_ME || audienceStr === 'only_me';
    const isMention = parent.mentions.map((m) => m.toString()).includes(viewerId);
    const isFriend = await this.friendsService.isFriendOf(viewerId, ownerId);
    if (isOnlyMe) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CANNOT_ENGAGE_WITH_INACCESSIBLE_POST);
    }
    if (isFriendsOnly && !isFriend && !isMention) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CANNOT_ENGAGE_WITH_INACCESSIBLE_POST);
    }
    if (!isPublic && !isFriendsOnly) {
      throw new ForbiddenError(VALIDATION_ERROR_MESSAGE.CANNOT_ENGAGE_WITH_INACCESSIBLE_POST);
    }
  }

  async updatePostsViews<T extends PostDetailResponseDTO | PostNewFeedResponseDTO>({
    posts,
    userId
  }: {
    posts: T[];
    userId?: string;
  }): Promise<T[]> {
    const date = new Date();

    // increase views for each post
    await this.postRepository.updatePosts({ posts, userId, date });

    // update post with new views
    return posts.map((post) => ({
      ...post,
      updatedAt: date,
      userViews: userId ? post.userViews + 1 : post.userViews,
      guestViews: userId ? post.guestViews : post.guestViews + 1
    }));
  }
}

export default PostsService;
