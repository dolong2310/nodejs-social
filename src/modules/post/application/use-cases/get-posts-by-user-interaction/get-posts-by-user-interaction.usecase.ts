import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import type { PostServicePort } from '@/modules/post/application/services/post.service';
import {
  GetPostsByUserInteractionPort,
  type GetPostsByUserInteractionInputPort,
  GetPostsByUserInteractionOutputPort
} from '@/modules/post/application/use-cases/get-posts-by-user-interaction/get-posts-by-user-interaction.port';
import { transformUnknownAuthor } from '@/modules/post/application/utils/transform-unknown-user.util';
import type { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import type { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.types';
import type { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import type { FriendServicePort } from '@/modules/relationship/application/services/friend.service';

export class GetPostsByUserInteractionUseCase extends GetPostsByUserInteractionPort {
  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postService: PostServicePort,
    private readonly friendService: FriendServicePort,
    private readonly blockService: BlockServicePort
  ) {
    super();
  }

  async execute<T extends PostDetailWithAuthorOutput>(
    input: GetPostsByUserInteractionInputPort
  ): Promise<GetPostsByUserInteractionOutputPort<T>> {
    const { userId, interaction, cursor, limit } = input;
    const before = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);
    const [friendUserIds, blockedAuthorIds] = await Promise.all([
      this.friendService.findFriendUserIds(userId),
      this.blockService.getBlockedIdsByUserId(userId)
    ]);
    const blockedForInteraction = blockedAuthorIds.filter((id) => id !== userId);
    const extraVisiblePostIds =
      blockedForInteraction.length > 0
        ? await this.postService.getBlockedPostIds({
            userId,
            blockedAuthorIds: blockedForInteraction
          })
        : [];

    const results = await this.postQueryRepository.findPostsByUserInteraction({
      currentUserId: userId,
      interaction,
      friendUserIds,
      blockedAuthorIds,
      extraVisiblePostIds: extraVisiblePostIds.length > 0 ? extraVisiblePostIds : undefined,
      cursor: before,
      limit
    });
    const hasMore = results.length > limit;
    const posts = results.slice(0, limit);
    const blockedIds = new Set(blockedForInteraction);

    for (const post of posts) {
      if (post.author && blockedIds.has(post.author.id)) {
        transformUnknownAuthor(post);
      }
    }

    const updatedPosts = this.postService.updatePostsViews<PostDetailWithAuthorOutput>({ posts, userId });
    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodeCursor(last.createdAt, last.id) : null;

    return new GetPostsByUserInteractionOutputPort<T>({ items: updatedPosts as T[], nextCursor });
  }
}
