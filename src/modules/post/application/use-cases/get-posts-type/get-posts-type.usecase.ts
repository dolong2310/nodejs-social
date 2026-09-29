import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostNotFoundException } from '@/modules/post/application/exceptions/post.exception';
import { PostAudienceAccessServicePort } from '@/modules/post/application/services/post-audience-access.service';
import { PostServicePort } from '@/modules/post/application/services/post.service';
import {
  GetPostsTypePort,
  GetPostsTypeInputPort,
  GetPostsTypeOutputPort
} from '@/modules/post/application/use-cases/get-posts-type/get-posts-type.port';
import { transformUnknownAuthorForPostDetail } from '@/modules/post/application/utils/transform-unknown-user.util';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.type';
import { BlockServicePort } from '@/modules/relationship/application/services/block.service';

export class GetPostsTypeUseCase extends GetPostsTypePort {
  private readonly log: LoggerPort;

  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postAudienceAccess: PostAudienceAccessServicePort,
    private readonly postService: PostServicePort,
    private readonly blockService: BlockServicePort,
    private readonly logger: LoggerPort
  ) {
    super();
    this.log = this.logger.child({ module: 'posts-service' });
  }

  async execute<T extends PostDetailWithAuthorOutput>(
    input: GetPostsTypeInputPort
  ): Promise<GetPostsTypeOutputPort<T>> {
    const { userId, cursor, limit, postId, type } = input;
    const parentPost = await this.postQueryRepository.findPostDetailById(postId, userId);
    if (!parentPost) {
      throw new PostNotFoundException();
    }
    await this.postAudienceAccess.assertUserCanAccessPostDetail(parentPost, userId);

    const before = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);
    // Load posts by postId and type.
    const results = await this.postQueryRepository.findPostsType({
      postId,
      type,
      currentUserId: userId,
      cursor: before,
      limit
    });
    const hasMore = results.length > limit;
    const posts = results.slice(0, limit);

    if (userId) {
      // Load all users with a two-way block relationship with the user (user blocked them or they blocked user).
      const blockedIds = await this.blockService.getBlockedIdsByUserId(userId);
      if (blockedIds.length > 0) {
        // Check whether the user has previously interacted with the parent post (like/bookmark/comment).
        const isInteracted = await this.postQueryRepository.isUserInteractedWithPost({ userId, postId });
        if (isInteracted) {
          const uniqueIds = new Set(blockedIds);
          for (const post of posts) {
            if (uniqueIds.has(post.userId)) {
              // Redact the author of each blocked row by replacing it with Unknown user while keeping post content.
              transformUnknownAuthorForPostDetail(post);
            }
          }
        }
      }
    }

    // Update view counters for the loaded posts.
    const updatedPosts = this.postService.updatePostsViews<PostDetailWithAuthorOutput>({ posts, userId });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodeCursor(last.createdAt, last.id) : null;

    return new GetPostsTypeOutputPort<T>({ items: updatedPosts as T[], nextCursor });
  }
}
