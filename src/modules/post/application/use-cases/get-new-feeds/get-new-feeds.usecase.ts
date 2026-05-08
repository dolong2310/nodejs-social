import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostServicePort } from '@/modules/post/application/services/post.service';
import {
  GetNewFeedsPort,
  GetNewFeedsQuery,
  GetNewFeedsResult
} from '@/modules/post/application/use-cases/get-new-feeds/get-new-feeds.port';
import { transformUnknownAuthor } from '@/modules/post/application/utils/transform-unknown-user.util';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import { IPostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.type';
import { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import { FriendServicePort } from '@/modules/relationship/application/services/friend.service';

/**
 * Lấy danh sách bài viết mới nhất cho user đã đăng nhập
 * - Áp dụng luật chặn 2 chiều (ai block ai đều tính).
 * - Vẫn cho phép hiển thị một số bài của tác giả bị block nếu viewer đã từng tương tác trước đó (like/bookmark/comment) — nhưng ẩn danh tính tác giả.
 * - Cập nhật lượt xem cho các bài vừa load.
 */
export class GetNewFeedsUseCase extends GetNewFeedsPort {
  private readonly log: LoggerPort;

  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postService: PostServicePort,
    private readonly blockService: BlockServicePort,
    private readonly friendService: FriendServicePort,
    private readonly logger: LoggerPort
  ) {
    super();
    this.log = this.logger.child({ module: 'posts-service' });
  }

  async execute<T extends IPostDetailWithAuthorOutput>({
    userId,
    cursor,
    limit
  }: GetNewFeedsQuery): Promise<GetNewFeedsResult<T>> {
    const before = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);

    // Lấy song song friend list và blocked list (hai nguồn độc lập nhau)
    const [friendUserIds, blockedAuthorIds] = await Promise.all([
      this.friendService.findFriendUserIds(userId),
      this.blockService.getBlockedIdsByUserId(userId)
    ]);

    // Loại chính userId ra khỏi danh sách block để dùng cho rule "engagement"
    const blockedForInteraction = blockedAuthorIds.filter((id) => id !== userId);

    // Nếu có blocked authors, lấy các post ID mà viewer đã tương tác
    const extraVisiblePostIds =
      blockedForInteraction.length > 0
        ? await this.postService.getBlockedPostIds({
            userId,
            blockedAuthorIds: blockedForInteraction
          })
        : [];

    // Lấy danh sách bài viết
    const results = await this.postQueryRepository.findPosts({
      userId,
      friendUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraVisiblePostIds.length > 0 ? extraVisiblePostIds : undefined,
      cursor: before,
      limit
    });
    const hasMore = results.length > limit;
    const posts = results.slice(0, limit);

    // Với bài nào thuộc blocked author nhưng được "nới quyền xem" do đã tương tác trước đó
    const blockedIds = new Set(blockedForInteraction);
    for (const post of posts) {
      if (post.author && blockedIds.has(post.author.id)) {
        // Ẩn danh tác giả (thay thế author thành Unknown user)
        transformUnknownAuthor(post);
      }
    }

    // tăng guestViews/userViews tương ứng và cập nhật updatedAt
    const updatedPosts = this.postService.updatePostsViews<IPostDetailWithAuthorOutput>({ posts, userId });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodeCursor(last.createdAt, last.id) : null;

    return new GetNewFeedsResult<T>({ items: updatedPosts as T[], nextCursor });
  }
}
