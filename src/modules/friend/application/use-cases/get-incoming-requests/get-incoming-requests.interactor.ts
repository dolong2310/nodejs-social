import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import { InvalidCursorException } from '@/modules/core/application/cursor.exception';
import {
  GetIncomingRequestsInPort,
  GetIncomingRequestsQuery,
  GetIncomingRequestsResult
} from '@/modules/friend/application/use-cases/get-incoming-requests/get-incoming-requests.in-port';
import { FriendRequestRepositoryPort } from '@/modules/friend/domain/repositories/friend-request.repository';
import { UserQueryRepositoryPort } from '@/modules/user/application/ports/queries/user-query.repository';
import { UserRecordProps } from '@/modules/user/domain/entities/user.type';

export class GetIncomingRequestsInteractor extends GetIncomingRequestsInPort {
  constructor(
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly userQueryRepository: UserQueryRepositoryPort
  ) {
    super();
  }

  async execute({ userId, limit, cursor }: GetIncomingRequestsQuery): Promise<GetIncomingRequestsResult> {
    const pageSize = Math.min(100, Math.max(1, limit));

    const decoded = decodeCursorOrThrow(cursor, (raw) => decodeCursor(raw), InvalidCursorException);

    const incomingRequestEntities = await this.friendRequestRepository.listIncomingForUser({
      toUserId: userId,
      limit: pageSize + 1,
      cursor: decoded
    });
    const incomingRequests = incomingRequestEntities.map((request) => request.toObject());
    const hasMore = incomingRequests.length > pageSize;
    const requests = incomingRequests.slice(0, pageSize);

    const idStrings = requests.map((request) => request.fromUserId);
    const users = await this.userQueryRepository.findManyUsersByIdsIncludeNameUsernameAvatar(idStrings);
    const userMap = new Map(users.map((user) => [user.id, user]));
    const items = idStrings.map((id) => userMap.get(id)).filter((u): u is UserRecordProps => Boolean(u));

    const last = requests[requests.length - 1];
    const nextCursor = hasMore && last ? encodeCursor(last.createdAt ?? new Date(0), last.id) : null;

    return new GetIncomingRequestsResult(items, nextCursor);
  }
}
