import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import type { PostServicePort } from '@/modules/post/application/services/post.service';
import {
  SearchPostsPort,
  type SearchPostsInputPort,
  SearchPostsOutputPort
} from '@/modules/post/application/use-cases/search-posts/search-posts.port';
import { transformUnknownAuthor } from '@/modules/post/application/utils/transform-unknown-user.util';
import type { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import type { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.types';
import type { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import type { FriendServicePort } from '@/modules/relationship/application/services/friend.service';

export class SearchPostsUseCase extends SearchPostsPort {
  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly friendService: FriendServicePort,
    private readonly postsService: PostServicePort,
    private readonly blockService: BlockServicePort
  ) {
    super();
  }

  async execute<T extends PostDetailWithAuthorOutput>(input: SearchPostsInputPort): Promise<SearchPostsOutputPort<T>> {
    const { userId, query = '', type, people, cursor, limit } = input;
    let blockedAuthorIds: string[] | undefined;
    let extraVisiblePostIds: string[] = [];

    // Load blocked authors when authenticated.
    if (userId) {
      blockedAuthorIds = await this.blockService.getBlockedIdsByUserId(userId);
    }

    // If the user previously interacted with posts by blocked authors, still load those postIds for display as Unknown user.
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

    // Redact the author if the post belongs to a blocked user.
    if (userId && blockedAuthorIds && blockedAuthorIds.length > 0) {
      const blockedIds = new Set(blockedAuthorIds.filter((id) => id !== userId));
      for (const post of posts) {
        if (post.author && blockedIds.has(post.author.id)) {
          transformUnknownAuthor(post);
        }
      }
    }

    // Update view counters for the loaded posts.
    const updatedPosts = this.postsService.updatePostsViews<PostDetailWithAuthorOutput>({ posts, userId });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodeCursor(last.createdAt, last.id) : null;

    return new SearchPostsOutputPort({ items: updatedPosts as T[], nextCursor });
  }
}
