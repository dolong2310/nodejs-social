import { EPostType } from '@/enums/posts.enum';
import { ICreatePostRequestBody } from '@/models/requests/post.request';
import { IPostDetailResponse, IPostNewFeedResponse } from '@/models/responses/post.response';
import { IHashtag } from '@/models/schemas/hashtag.schema';
import { IPost } from '@/models/schemas/post.schema';
import { IPostRepository } from '@/repositories/post.repository';
import { ObjectId } from 'mongodb';

export interface IPostsService {
  findPostDetail(postId: string): Promise<IPostDetailResponse | null>;
  getNewFeeds(payload: {
    userId: string;
    followedUserIds: ObjectId[];
    page: number;
    limit: number;
  }): Promise<{ posts: IPostNewFeedResponse[]; totalPosts: number }>;
  getGuestNewFeeds(payload: {
    page: number;
    limit: number;
  }): Promise<{ posts: IPostNewFeedResponse[]; totalPosts: number }>;
  getPostsType(payload: {
    userId?: string;
    page: number;
    limit: number;
    postId: string;
    type: EPostType;
  }): Promise<{ posts: IPostDetailResponse[]; totalPosts: number }>;
  findPostById(postId: string): Promise<IPost | null>;
  findAndUpsertHashtags(hashtags: string[]): Promise<(IHashtag | null)[]>;
  increaseViews(payload: {
    postId: string;
    userId?: string;
  }): Promise<Pick<IPost, 'userViews' | 'guestViews' | 'updatedAt'> | null>;
  createPost(payload: { userId: string; body: ICreatePostRequestBody }): Promise<IPost>;
  updatePostsViews<T extends IPostDetailResponse | IPostNewFeedResponse>({
    posts,
    userId
  }: {
    posts: T[];
    userId?: string;
  }): Promise<T[]>;
}

class PostsService implements IPostsService {
  constructor(private readonly postRepository: IPostRepository) {}

  findPostDetail(postId: string) {
    return this.postRepository.findById(postId);
  }

  async getNewFeeds({
    userId,
    followedUserIds,
    page,
    limit
  }: {
    userId: string;
    followedUserIds: ObjectId[];
    page: number;
    limit: number;
  }) {
    const postsPromise = this.postRepository.findPosts({
      userId,
      followedUserIds,
      page,
      limit
    });
    const totalPostsPromise = this.postRepository.countPosts({ userId, followedUserIds });
    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    const updatedPosts = await this.updatePostsViews<IPostNewFeedResponse>({ posts });

    return { posts: updatedPosts, totalPosts };
  }

  async getGuestNewFeeds({ page, limit }: { page: number; limit: number }) {
    const postsPromise = this.postRepository.findGuestPosts({ page, limit });
    const totalPostsPromise = this.postRepository.countGuestPosts();
    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    const updatedPosts = await this.updatePostsViews<IPostNewFeedResponse>({ posts });

    return { posts: updatedPosts, totalPosts };
  }

  async getPostsType({
    userId,
    page,
    limit,
    postId,
    type
  }: {
    userId?: string;
    page: number;
    limit: number;
    postId: string;
    type: EPostType;
  }) {
    const postsPromise = this.postRepository.findPostsType({ page, limit, postId, type });
    const totalPostsPromise = this.postRepository.countPostsType({ postId, type });
    const [posts, totalPosts] = await Promise.all([postsPromise, totalPostsPromise]);

    const updatedPosts = await this.updatePostsViews<IPostDetailResponse>({ posts, userId });

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
  }: {
    postId: string;
    userId?: string;
  }): Promise<Pick<IPost, 'userViews' | 'guestViews' | 'updatedAt'> | null> {
    return this.postRepository.findOneAndUpdate(
      { postId, userId },
      { returnDocument: 'after', projection: { userViews: 1, guestViews: 1, updatedAt: 1 } }
    );
  }

  async createPost({ userId, body }: { userId: string; body: ICreatePostRequestBody }): Promise<IPost> {
    const { hashtags: hashtagsBody } = body;

    const hashtags = await this.findAndUpsertHashtags(hashtagsBody);
    const hashtagIds = hashtags.filter(Boolean).map((hashtag) => hashtag!._id) as ObjectId[];
    const newPost = await this.postRepository.createPost({ userId, body: { ...body, hashtags: hashtagIds } });
    return newPost;
  }

  async updatePostsViews<T extends IPostDetailResponse | IPostNewFeedResponse>({
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
