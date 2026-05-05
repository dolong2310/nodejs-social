import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostQueryRepositoryPort } from '@/modules/post/application/ports/queries/post-query.repository';
import { IPostDetailWithAuthorOutput } from '@/modules/post/application/ports/queries/post-query.type';
import { PostServicePort } from '@/modules/post/application/services/post.service';
import {
  GetGuestNewFeedsPort,
  GetGuestNewFeedsQuery,
  GetGuestNewFeedsResult
} from '@/modules/post/application/use-cases/get-guest-new-feeds/get-guest-new-feeds.port';

export class GetGuestNewFeedsUseCase extends GetGuestNewFeedsPort {
  private readonly log: LoggerPort;

  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postService: PostServicePort,
    private readonly logger: LoggerPort
  ) {
    super();
    this.log = this.logger.child({ module: 'posts-service' });
  }

  async execute<T extends IPostDetailWithAuthorOutput>({
    cursor,
    limit
  }: GetGuestNewFeedsQuery): Promise<GetGuestNewFeedsResult<T>> {
    const before = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);
    const results = await this.postQueryRepository.findGuestPosts({ cursor: before, limit });
    const hasMore = results.length > limit;
    const posts = results.slice(0, limit);

    const updatedPosts = this.postService.updatePostsViews<IPostDetailWithAuthorOutput>({ posts });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodeCursor(last.createdAt, last.id) : null;

    return new GetGuestNewFeedsResult<T>({ items: updatedPosts as T[], nextCursor });
  }
}
