import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostNotFoundException } from '@/modules/post/application/exceptions/post.exception';
import { PostAudienceAccessServicePort } from '@/modules/post/application/services/post-audience-access.service';
import { PostServicePort } from '@/modules/post/application/services/post.service';
import {
  GetPostsTypePort,
  GetPostsTypeQuery,
  GetPostsTypeResult
} from '@/modules/post/application/use-cases/get-posts-type/get-posts-type.port';
import { transformUnknownAuthorForPostDetail } from '@/modules/post/application/utils/transform-unknown-user.util';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import { PostDetailOutput } from '@/modules/post/domain/repositories/post.query.type';
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

  async execute<T extends PostDetailOutput>({
    userId,
    cursor,
    limit,
    postId,
    type
  }: GetPostsTypeQuery): Promise<GetPostsTypeResult<T>> {
    const parentPost = await this.postQueryRepository.findPostDetailById(postId);
    if (!parentPost) {
      throw new PostNotFoundException();
    }
    await this.postAudienceAccess.assertViewerCanAccessPostDetail(parentPost, userId);

    const before = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);
    // Lấy danh sách bài viết theo postId và type.
    const results = await this.postQueryRepository.findPostsType({ postId, type, cursor: before, limit });
    const hasMore = results.length > limit;
    const posts = results.slice(0, limit);

    if (userId) {
      // Lấy toàn bộ user có quan hệ block với viewer theo cả 2 chiều (viewer block họ hoặc họ block viewer).
      const blockedIds = await this.blockService.getBlockedIdsByUserId(userId);
      if (blockedIds.length > 0) {
        // Kiểm tra viewer đã từng tương tác post cha chưa (like/bookmark/comment).
        const isInteracted = await this.postQueryRepository.isViewerInteractedWithPost({ viewerId: userId, postId });
        if (isInteracted) {
          const uniqueIds = new Set(blockedIds);
          for (const post of posts) {
            if (uniqueIds.has(post.userId)) {
              // Ẩn thông tin tác giả của từng row bị block (thay thế thành “Unknown user”), giữ nội dung post.
              transformUnknownAuthorForPostDetail(post);
            }
          }
        }
      }
    }

    // Cập nhật lượt xem cho các bài vừa load.
    const updatedPosts = this.postService.updatePostsViews<PostDetailOutput>({ posts, userId });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodeCursor(last.createdAt, last.id) : null;

    return new GetPostsTypeResult<T>({ items: updatedPosts as T[], nextCursor });
  }
}
