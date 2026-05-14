import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import { PostServicePort } from '@/modules/post/application/services/post.service';
import {
  SearchPostsPort,
  SearchPostsQuery,
  SearchPostsResult
} from '@/modules/post/application/use-cases/search-posts/search-posts.port';
import { transformUnknownAuthor } from '@/modules/post/application/utils/transform-unknown-user.util';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.type';
import { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import { FriendServicePort } from '@/modules/relationship/application/services/friend.service';

export class SearchPostsUseCase extends SearchPostsPort {
  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly friendService: FriendServicePort,
    private readonly postsService: PostServicePort,
    private readonly blockService: BlockServicePort
  ) {
    super();
  }

  async execute<T extends PostDetailWithAuthorOutput>({
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
    const updatedPosts = this.postsService.updatePostsViews<PostDetailWithAuthorOutput>({ posts, userId });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodeCursor(last.createdAt, last.id) : null;

    return new SearchPostsResult({ items: updatedPosts as T[], nextCursor });
  }
}
