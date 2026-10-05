import type { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { CACHE_KEYS, CACHE_TTL } from '@/modules/post/application/constants/cache.constants';
import type { PostViewsQueuePort } from '@/modules/post/application/ports/post-views-job.port';
import type {
  GetBlockedPostIdsPayload,
  IsUserInteractedWithPostPayload,
  UpdatePostsViewsPayload
} from '@/modules/post/application/services/post.service.types';
import type { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import type { PostDetailOutput, PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.types';

export interface PostServicePort {
  updatePostsViews<T extends PostDetailOutput | PostDetailWithAuthorOutput>(payload: UpdatePostsViewsPayload<T>): T[];
  isUserInteractedWithPost(payload: IsUserInteractedWithPostPayload): Promise<boolean>;
  getBlockedPostIds(payload: GetBlockedPostIdsPayload): Promise<string[]>;
}

export class PostService implements PostServicePort {
  private readonly log: LoggerPort;

  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postViewsQueue: PostViewsQueuePort,
    private readonly cache: CacheManagerPort,
    private readonly logger: LoggerPort
  ) {
    this.log = this.logger.child({ module: 'posts-service' });
  }

  updatePostsViews<T extends PostDetailOutput | PostDetailWithAuthorOutput>({
    posts,
    userId
  }: UpdatePostsViewsPayload<T>): T[] {
    if (posts.length === 0) return posts;
    void this.postViewsQueue
      .add({
        postIds: posts.map((post) => post.id),
        isAuthenticatedUser: Boolean(userId)
      })
      .catch((err: unknown) => {
        this.log.warn({ err }, 'post-service:::enqueue-post-views-job-failed');
      });

    // update post with new views
    const date = new Date();
    return posts.map((post) => {
      const userViews = userId ? (post.userViews ?? 0) + 1 : post.userViews;
      const guestViews = userId ? post.guestViews : (post.guestViews ?? 0) + 1;
      return {
        ...post,
        updatedAt: date,
        userViews,
        guestViews
      };
    });
  }

  /**
   * Check whether the user (userId) has ever interacted with the post (postId).
   * Return true/false for visibility rules in block scenarios.
   */
  async isUserInteractedWithPost({ userId, postId }: IsUserInteractedWithPostPayload): Promise<boolean> {
    const isInteracted = await this.postQueryRepository.isUserInteractedWithPost({ userId, postId });
    return isInteracted;
  }

  /**
   * Even when post authors are blocked, if the user (userId) has previously interacted with their posts
   * (like/bookmark/comment), still return those post ids so they can be shown by the "blocked-interaction
   * exception" rule.
   */
  async getBlockedPostIds({ userId, blockedAuthorIds }: GetBlockedPostIdsPayload): Promise<string[]> {
    const authorIds = blockedAuthorIds.filter((id) => id !== userId).sort();
    if (authorIds.length === 0) return [];
    const key = CACHE_KEYS.blockedPostIds({ userId, blockedAuthorIds: authorIds });
    const extraVisiblePostIds = await this.cache.read(
      key,
      () => this.postQueryRepository.findPostIdsWhereUserInteractedWithAuthors({ userId, authorIds }),
      { ttlSeconds: CACHE_TTL.BLOCKED_INTERACTION_POST_IDS }
    );

    return extraVisiblePostIds ?? [];
  }
}
