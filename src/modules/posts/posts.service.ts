import { Injectable } from '@/decorators/injectable.decorator';
import { BaseService } from '@/modules/base/base.service';
import { BlockRepository } from '@/modules/blocks/blocks.repository';
import { FriendsService } from '@/modules/friends/friends.service';
import {
  CreatePostRequestDTO,
  GetNewFeedsPayloadDTO,
  GetPostDetailParamsDTO,
  GetPostsParamsDTO,
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
import { PaginationQueryDTO } from '@/shared/dtos/common.request.dto';
import { IHashtag } from '@/shared/models/hashtag.schema';
import { redactNewFeedAuthor, redactPostRowAuthorForBlock } from '@/utils/block-redaction.util';

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
  getExtraVisiblePostIdsForBlockedEngagement(userId: string, blockedAuthorIds: string[]): Promise<string[]>;
}

@Injectable()
export class PostsService extends BaseService implements IPostsService {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly blockRepository: BlockRepository,
    private readonly friendsService: FriendsService
  ) {
    super();
  }

  findPostDetail(postId: string) {
    return this.postRepository.findById(postId);
  }

  async getNewFeeds({ userId, friendUserIds, page, limit }: GetNewFeedsPayloadDTO) {
    const blockedAuthorIds = await this.blockRepository.listUserIdsBlockedInEitherDirection(userId);
    const blockedForEngagement = blockedAuthorIds.filter((id) => id !== userId);
    const extraVisiblePostIds =
      blockedForEngagement.length > 0
        ? await this.postRepository.findPostIdsWhereViewerEngagedWithAuthors(userId, blockedForEngagement)
        : [];
    const postsPromise = this.postRepository.findPosts({
      userId,
      friendUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraVisiblePostIds.length > 0 ? extraVisiblePostIds : undefined,
      page: Number(page),
      limit: Number(limit)
    });
    const totalPostsPromise = this.postRepository.countPosts({
      userId,
      friendUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraVisiblePostIds.length > 0 ? extraVisiblePostIds : undefined
    });
    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    const blockedHex = new Set(blockedForEngagement);
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
      const blockedIds = await this.blockRepository.listUserIdsBlockedInEitherDirection(userId);
      if (blockedIds.length > 0) {
        const engaged = await this.postRepository.hasViewerEngagedWithPost(userId, postId);
        if (engaged) {
          const blockedHex = new Set(blockedIds);
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
    return this.postRepository.hasViewerEngagedWithPost(viewerId, postId);
  }

  async getExtraVisiblePostIdsForBlockedEngagement(userId: string, blockedAuthorIds: string[]): Promise<string[]> {
    const authors = blockedAuthorIds.filter((id) => id !== userId);
    if (authors.length === 0) {
      return [];
    }
    return this.postRepository.findPostIdsWhereViewerEngagedWithAuthors(userId, authors);
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

  private async assertThreadedEngagementAllowed(viewerId: string, body: CreatePostRequestDTO): Promise<void> {
    const parentId = body.parentId;
    if (!parentId) {
      throw PostNotFoundException;
    }
    const parent = await this.postRepository.findPostById(parentId);
    if (!parent) {
      throw PostNotFoundException;
    }
    if (await this.blockRepository.isBlockedEitherWay(viewerId, parent.userId.toHexString())) {
      throw CannotEngagePostBlockedException;
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
      throw StrangerCommentsNotAllowedException;
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
      throw CannotEngageWithInaccessiblePostException;
    }
    if (isFriendsOnly && !isFriend && !isMention) {
      throw CannotEngageWithInaccessiblePostException;
    }
    if (!isPublic && !isFriendsOnly) {
      throw CannotEngageWithInaccessiblePostException;
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
