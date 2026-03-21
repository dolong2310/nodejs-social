import { PaginationQueryDTO } from '@/dtos/requests/common.request.dto';
import {
  CreatePostRequestDTO,
  GetNewFeedsPayloadDTO,
  GetPostDetailParamsDTO,
  GetPostsParamsDTO,
  PatchPostRequestDTO
} from '@/dtos/requests/post.request.dto';
import { PostDetailResponseDTO, PostNewFeedResponseDTO } from '@/dtos/responses/post.response.dto';
import { IHashtag } from '@/models/schemas/hashtag.schema';
import { IPost } from '@/models/schemas/post.schema';
import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { IPostRepository } from '@/repositories/post.repository';
import { ForbiddenError, NotFoundError } from '@/responses/error.response';
import { BaseService } from '@/services/base.service';
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
}

class PostsService extends BaseService implements IPostsService {
  constructor(private readonly postRepository: IPostRepository) {
    super();
  }

  findPostDetail(postId: string) {
    return this.postRepository.findById(postId);
  }

  async getNewFeeds({ userId, followedUserIds, page, limit }: GetNewFeedsPayloadDTO) {
    const postsPromise = this.postRepository.findPosts({
      userId,
      followedUserIds,
      page: Number(page),
      limit: Number(limit)
    });
    const totalPostsPromise = this.postRepository.countPosts({ userId, followedUserIds });
    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

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

    const updatedPosts = await this.updatePostsViews<PostDetailResponseDTO>({ posts, userId });

    return { posts: updatedPosts, totalPosts };
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
