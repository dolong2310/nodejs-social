import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostServicePort } from '@/modules/post/application/services/post.service';
import {
  GetNewFeedsPort,
  GetNewFeedsInputPort,
  GetNewFeedsOutputPort
} from '@/modules/post/application/use-cases/get-new-feeds/get-new-feeds.port';
import { transformUnknownAuthor } from '@/modules/post/application/utils/transform-unknown-user.util';
import { EnumNewFeedFilter } from '@/modules/post/domain/entities/post.types';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.types';
import { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import { FriendServicePort } from '@/modules/relationship/application/services/friend.service';

/**
 * Get the latest posts for an authenticated user.
 * - Apply two-way block rules; either direction counts.
 * - Still allow some posts by blocked authors if the user previously interacted with them (like/bookmark/comment),
 *   but redact the author identity.
 * - Update view counters for the loaded posts.
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

  async execute<T extends PostDetailWithAuthorOutput>(input: GetNewFeedsInputPort): Promise<GetNewFeedsOutputPort<T>> {
    const { userId, cursor, limit, filter } = input;
    const before = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);

    // Load friend list and blocked list in parallel because they are independent sources.
    const [friendUserIds, blockedAuthorIds] = await Promise.all([
      this.friendService.findFriendUserIds(userId),
      this.blockService.getBlockedIdsByUserId(userId)
    ]);

    // Remove the current userId from the blocked list for the "interaction" rule.
    const blockedForInteraction = blockedAuthorIds.filter((id) => id !== userId);

    // If there are blocked authors, load post IDs the user has interacted with.
    const extraVisiblePostIds =
      blockedForInteraction.length > 0
        ? await this.postService.getBlockedPostIds({
            userId,
            blockedAuthorIds: blockedForInteraction
          })
        : [];

    // Load posts.
    const results = await this.postQueryRepository.findPosts({
      userId,
      friendUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraVisiblePostIds.length > 0 ? extraVisiblePostIds : undefined,
      authorUserIds:
        filter === EnumNewFeedFilter.FOLLOWING ? Array.from(new Set([...friendUserIds, userId])) : undefined,
      cursor: before,
      limit
    });
    const hasMore = results.length > limit;
    const posts = results.slice(0, limit);

    // For posts from blocked authors that are allowed because of previous interaction.
    const blockedIds = new Set(blockedForInteraction);
    for (const post of posts) {
      if (post.author && blockedIds.has(post.author.id)) {
        // Redact the author by replacing it with Unknown user.
        transformUnknownAuthor(post);
      }
    }

    // Increment guestViews/userViews accordingly and update updatedAt.
    const updatedPosts = this.postService.updatePostsViews<PostDetailWithAuthorOutput>({ posts, userId });

    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodeCursor(last.createdAt, last.id) : null;

    return new GetNewFeedsOutputPort<T>({ items: updatedPosts as T[], nextCursor });
  }
}
