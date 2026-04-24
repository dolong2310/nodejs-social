import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/application/common/utils/cursor.util';
import { transformUnknownAuthor } from '@/application/common/utils/transform-unknown-user.util';
import { InvalidCursorException } from '@/application/exceptions/cursor.exception';
import { LoggerPort } from '@/application/ports/logger.port';
import { PostQueryRepositoryPort } from '@/application/queries/post/post-query.repository';
import { IPostDetailWithAuthorOutput } from '@/application/queries/post/post-query.type';
import { IBlockService } from '@/application/services/block/block.service';
import { IFriendService } from '@/application/services/friend/friend.service';
import { IPostService } from '@/application/services/post/post.service';
import {
  GetNewFeedsInPort,
  GetNewFeedsQuery,
  GetNewFeedsResult
} from '@/application/use-cases/post/get-new-feeds/get-new-feeds.in-port';

/**
 * Lấy danh sách bài viết mới nhất cho user đã đăng nhập
 * - Áp dụng luật chặn 2 chiều (ai block ai đều tính).
 * - Vẫn cho phép hiển thị một số bài của tác giả bị block nếu viewer đã từng tương tác trước đó (like/bookmark/comment) — nhưng ẩn danh tính tác giả.
 * - Cập nhật lượt xem cho các bài vừa load.
 */
export class GetNewFeedsInteractor extends GetNewFeedsInPort {
  private readonly log: LoggerPort;

  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postService: IPostService,
    private readonly blockService: IBlockService,
    private readonly friendService: IFriendService,
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

    // Same DTO field name as before; values are mutual friend ids from friendships collection.
    const friendUserIds = await this.friendService.findFriendUserIds(userId);

    // Lấy danh sách user bị block liên quan đến viewer (cache ngắn hạn)
    const blockedAuthorIds = await this.blockService.getBlockedIdsByUserId(userId);

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
