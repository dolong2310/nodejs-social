import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/application/common/utils/cursor.util';
import { InvalidCursorException } from '@/application/exceptions/cursor.exception';
import {
  GetOutgoingRequestsInPort,
  GetOutgoingRequestsQuery,
  GetOutgoingRequestsResult
} from '@/application/use-cases/friend/get-outgoing-requests/get-outgoing-requests.in-port';
import { UserFullProps } from '@/domain/entities/user/user.type';
import { FriendRequestRepositoryPort } from '@/domain/repositories/friend-request/friend-request.repository';
import { UserRepositoryPort } from '@/domain/repositories/user/user.repository';

export class GetOutgoingRequestsInteractor extends GetOutgoingRequestsInPort {
  constructor(
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly userRepository: UserRepositoryPort
  ) {
    super();
  }

  async execute({ userId, limit, cursor }: GetOutgoingRequestsQuery): Promise<GetOutgoingRequestsResult> {
    const pageSize = Math.min(100, Math.max(1, limit));

    const decoded = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);

    const outgoingRequestEntities = await this.friendRequestRepository.listOutgoingForUser({
      fromUserId: userId,
      limit: pageSize + 1,
      cursor: decoded
    });
    const outgoingRequests = outgoingRequestEntities.map((request) => request.toObject());
    const hasMore = outgoingRequests.length > pageSize;
    const requests = outgoingRequests.slice(0, pageSize);

    const idStrings = requests.map((request) => request.toUserId);
    const users = (await this.userRepository.findManyUsersByIdsIncludeNameUsernameAvatar(idStrings)).map((user) =>
      user.toObject()
    );
    const userMap = new Map(users.map((user) => [user.id, user]));
    const ordered = idStrings.map((id) => userMap.get(id)).filter((u): u is UserFullProps => Boolean(u));

    const last = requests[requests.length - 1];
    const nextCursor = hasMore && last ? encodeCursor(last.createdAt ?? new Date(0), last.id) : null;
    const items = ordered.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      avatar: user.avatar
    }));

    return new GetOutgoingRequestsResult(items, nextCursor);
  }
}
