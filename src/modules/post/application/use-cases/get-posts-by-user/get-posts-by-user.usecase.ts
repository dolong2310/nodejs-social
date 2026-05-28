import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import { PostServicePort } from '@/modules/post/application/services/post.service';
import {
  GetPostsByUserPort,
  GetPostsByUserQuery,
  GetPostsByUserResult
} from '@/modules/post/application/use-cases/get-posts-by-user/get-posts-by-user.port';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';
import { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.type';
import { BlockServicePort } from '@/modules/relationship/application/services/block.service';
import { FriendServicePort } from '@/modules/relationship/application/services/friend.service';
import {
  CannotViewUserProfileBlockedException,
  UserNotFoundException
} from '@/modules/user/application/exceptions/user.exception';
import { UserServicePort } from '@/modules/user/application/services/user.service';

export class GetPostsByUserUseCase extends GetPostsByUserPort {
  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postService: PostServicePort,
    private readonly userService: UserServicePort,
    private readonly friendService: FriendServicePort,
    private readonly blockService: BlockServicePort
  ) {
    super();
  }

  async execute<T extends PostDetailWithAuthorOutput>({
    targetUserId,
    currentUserId,
    type,
    cursor,
    limit
  }: GetPostsByUserQuery): Promise<GetPostsByUserResult<T>> {
    const targetUser = await this.userService.findUserById(targetUserId, { querySafe: true });
    if (!targetUser) {
      throw new UserNotFoundException();
    }

    const isOwner = currentUserId === targetUserId;
    let isFriend = false;

    if (currentUserId && !isOwner) {
      const [blocked, friend] = await Promise.all([
        this.blockService.isBlockedEitherWay(currentUserId, targetUserId),
        this.friendService.isFriendOf({ userId: currentUserId, otherUserId: targetUserId })
      ]);

      if (blocked) {
        throw new CannotViewUserProfileBlockedException();
      }

      isFriend = friend;
    }

    const before = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);
    const results = await this.postQueryRepository.findPostsByUserId({
      targetUserId,
      currentUserId,
      type,
      canViewFriendsOnly: isOwner || isFriend,
      includeOnlyMe: isOwner,
      cursor: before,
      limit
    });
    const hasMore = results.length > limit;
    const posts = results.slice(0, limit);
    const updatedPosts = this.postService.updatePostsViews<PostDetailWithAuthorOutput>({
      posts,
      userId: currentUserId
    });
    const last = posts[posts.length - 1];
    const nextCursor = hasMore && last?.createdAt ? encodeCursor(last.createdAt, last.id) : null;

    return new GetPostsByUserResult({ items: updatedPosts as T[], nextCursor });
  }
}
