import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/application/common/utils/cursor.util';
import { transformUnknownAuthorForPostDetail } from '@/application/common/utils/transform-unknown-user.util';
import { InvalidCursorException } from '@/application/exceptions/cursor.exception';
import { LoggerPort } from '@/application/ports/logger.port';
import { PostQueryRepositoryPort } from '@/application/queries/post/post-query.repository';
import { IPostDetailOutput } from '@/application/queries/post/post-query.type';
import { IBlockService } from '@/application/services/block/block.service';
import { IPostService } from '@/application/services/post/post.service';
import {
  GetPostsTypeInPort,
  GetPostsTypeQuery,
  GetPostsTypeResult
} from '@/application/use-cases/post/get-posts-type/get-posts-type.in-port';

export class GetPostsTypeInteractor extends GetPostsTypeInPort {
  private readonly log: LoggerPort;

  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postService: IPostService,
    private readonly blockService: IBlockService,
    private readonly logger: LoggerPort
  ) {
    super();
    this.log = this.logger.child({ module: 'posts-service' });
  }

  async execute<T extends IPostDetailOutput>({
    userId,
    cursor,
    limit,
    postId,
    type
  }: GetPostsTypeQuery): Promise<GetPostsTypeResult<T>> {
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
    const updatedPosts = this.postService.updatePostsViews<IPostDetailOutput>({ posts, userId });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodeCursor(last.createdAt, last.id) : null;

    return new GetPostsTypeResult<T>({ items: updatedPosts as T[], nextCursor });
  }
}
