import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { CACHE_KEYS, CACHE_TTL } from '@/modules/post/application/constants/cache.constant';
import { PostViewsQueuePort } from '@/modules/post/application/ports/post-views-job.port';
import {
  GetBlockedPostIdsPayload,
  IsViewerInteractedWithPostPayload,
  UpdatePostsViewsPayload
} from '@/modules/post/application/services/post.service.type';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import { PostDetailOutput, PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.type';

export interface PostServicePort {
  updatePostsViews<T extends PostDetailOutput | PostDetailWithAuthorOutput>(payload: UpdatePostsViewsPayload<T>): T[];
  isViewerInteractedWithPost(payload: IsViewerInteractedWithPostPayload): Promise<boolean>;
  getBlockedPostIds(payload: GetBlockedPostIdsPayload): Promise<string[]>;
}

export class PostService implements PostServicePort {
  private readonly log: LoggerPort;

  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postViewsQueue: PostViewsQueuePort,
    private readonly cache: CacheStrategyPort,
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
        isAuthenticatedViewer: Boolean(userId)
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
   * Check whether the viewer (viewerId) has ever interacted with the post (postId).
   * Return true/false for visibility rules in block scenarios.
   */
  async isViewerInteractedWithPost({ viewerId, postId }: IsViewerInteractedWithPostPayload): Promise<boolean> {
    const isInteracted = await this.postQueryRepository.isViewerInteractedWithPost({ viewerId, postId });
    return isInteracted;
  }

  /**
   * Even when post authors are blocked, if the viewer (userId) has previously interacted with their posts
   * (like/bookmark/comment), still return those post ids so they can be shown by the "blocked-engagement
   * exception" rule.
   */
  async getBlockedPostIds({ userId, blockedAuthorIds }: GetBlockedPostIdsPayload): Promise<string[]> {
    const authorIds = blockedAuthorIds.filter((id) => id !== userId).sort();
    if (authorIds.length === 0) return [];
    const key = CACHE_KEYS.blockedPostIds({ userId, blockedAuthorIds: authorIds });
    const extraVisiblePostIds = await this.cache.get(
      key,
      () => this.postQueryRepository.findPostIdsWhereViewerInteractedWithAuthors({ viewerId: userId, authorIds }),
      { ttlSeconds: CACHE_TTL.BLOCKED_INTERACTION_POST_IDS }
    );

    return extraVisiblePostIds ?? [];
  }
}
