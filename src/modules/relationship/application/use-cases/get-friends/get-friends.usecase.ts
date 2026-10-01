import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import {
  GetFriendsPort,
  GetFriendsInputPort,
  GetFriendsOutputPort
} from '@/modules/relationship/application/use-cases/get-friends/get-friends.port';
import { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';
import { UserFullProps } from '@/modules/user/domain/entities/user.types';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class GetFriendsUseCase extends GetFriendsPort {
  constructor(
    private readonly friendshipRepository: FriendshipRepositoryPort,
    private readonly userRepository: UserRepositoryPort
  ) {
    super();
  }

  async execute(input: GetFriendsInputPort): Promise<GetFriendsOutputPort> {
    const { userId, limit, cursor } = input;
    const decodedCursor = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw, true), InvalidCursorException);

    const pageSize = Math.min(100, Math.max(1, limit));
    // Load the user's friend ids by cursor and limit.
    const friendIds = await this.friendshipRepository.listFriendIdsByCursor({
      userId,
      limit: pageSize + 1,
      cursor: decodedCursor
    });
    const hasMore = friendIds.length > pageSize;
    const ids = friendIds.slice(0, pageSize);
    // Load actual user info (name/avatar/username...) from the users collection based on the id list.
    const users = (await this.userRepository.findManyUsersByIds(ids)).map((user) => user.toObject());
    // Create a map from id string to user object to avoid another DB lookup.
    // Because DB $in queries do not guarantee input order, remap by idStrings.
    // - Ensures the response follows the computed pagination order.
    const idToUserMap = new Map(users.map((user) => [user.id, user]));
    // Reorder users by idStrings.
    const ordered = ids.map((id) => idToUserMap.get(id)).filter((u): u is UserFullProps => Boolean(u));
    // Create cursor for the next page.
    const nextCursor = hasMore && ids.length > 0 ? encodeCursor(ids[ids.length - 1]) : null;
    // Return the ordered friend list and next-page cursor.
    const items = ordered.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar
    }));

    return new GetFriendsOutputPort(items, nextCursor);
  }
}
