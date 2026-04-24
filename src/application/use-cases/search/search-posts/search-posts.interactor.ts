import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/application/common/utils/cursor.util';
import { transformUnknownAuthor } from '@/application/common/utils/transform-unknown-user.util';
import { InvalidCursorException } from '@/application/exceptions/cursor.exception';
import { PostQueryRepositoryPort } from '@/application/queries/post/post-query.repository';
import { IPostDetailWithAuthorOutput } from '@/application/queries/post/post-query.type';
import { IBlockService } from '@/application/services/block/block.service';
import { IFriendService } from '@/application/services/friend/friend.service';
import { IPostService } from '@/application/services/post/post.service';
import {
  SearchPostsInPort,
  SearchPostsQuery,
  SearchPostsResult
} from '@/application/use-cases/search/search-posts/search-posts.in-port';

export class SearchPostsInteractor extends SearchPostsInPort {
  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly friendService: IFriendService,
    private readonly postsService: IPostService,
    private readonly blockService: IBlockService
  ) {
    super();
  }

  async execute<T extends IPostDetailWithAuthorOutput>({
    userId,
    query = '',
    type,
    people,
    cursor,
    limit
  }: SearchPostsQuery): Promise<SearchPostsResult<T>> {
    let blockedAuthorIds: string[] | undefined;
    let extraVisiblePostIds: string[] = [];

    // Lấy danh sách tác giả bị block (nếu đang đăng nhập)
    if (userId) {
      blockedAuthorIds = await this.blockService.getBlockedIdsByUserId(userId);
    }

    // nếu viewer từng tương tác (like/bookmark/comment) với bài của các tác giả bị block, thì vẫn lấy ra postId của các bài đó để hiển thị (Unknown user)
    if (userId && blockedAuthorIds && blockedAuthorIds.length > 0) {
      extraVisiblePostIds = await this.postsService.getBlockedPostIds({
        userId,
        blockedAuthorIds
      });
    }

    const before = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);
    const results = await this.postQueryRepository.findPostsForSearch({
      userId,
      query,
      type,
      people,
      cursor: before,
      limit,
      findFriendUserIds: this.friendService.findFriendUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraVisiblePostIds.length > 0 ? extraVisiblePostIds : undefined
    });
    const hasMore = results.length > limit;
    const posts = results.slice(0, limit);

    // Redact (ẩn danh) tác giả nếu post thuộc người bị block
    if (userId && blockedAuthorIds && blockedAuthorIds.length > 0) {
      const blockedIds = new Set(blockedAuthorIds.filter((id) => id !== userId));
      for (const post of posts) {
        if (post.author && blockedIds.has(post.author.id)) {
          transformUnknownAuthor(post);
        }
      }
    }

    // Cập nhật lượt xem cho các bài vừa load
    const updatedPosts = this.postsService.updatePostsViews<IPostDetailWithAuthorOutput>({ posts, userId });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodeCursor(last.createdAt, last.id) : null;

    return new SearchPostsResult({ items: updatedPosts as T[], nextCursor });
  }
}
