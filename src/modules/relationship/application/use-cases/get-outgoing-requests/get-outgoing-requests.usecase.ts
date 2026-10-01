import { InvalidCursorException } from '@/modules/common/application/exceptions/cursor.exception';
import { decodeCursor, decodeCursorOrThrow, encodeCursor } from '@/modules/common/utils/cursor.util';
import {
  GetOutgoingRequestsPort,
  type GetOutgoingRequestsInputPort,
  GetOutgoingRequestsOutputPort
} from '@/modules/relationship/application/use-cases/get-outgoing-requests/get-outgoing-requests.port';
import type { FriendRequestRepositoryPort } from '@/modules/relationship/domain/repositories/friend-request.repository';
import type { UserRecordProps } from '@/modules/user/domain/entities/user.types';
import type { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';

export class GetOutgoingRequestsUseCase extends GetOutgoingRequestsPort {
  constructor(
    private readonly friendRequestRepository: FriendRequestRepositoryPort,
    private readonly userQueryRepository: UserQueryRepositoryPort
  ) {
    super();
  }

  async execute(input: GetOutgoingRequestsInputPort): Promise<GetOutgoingRequestsOutputPort> {
    const { userId, limit, cursor } = input;
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
    const users = await this.userQueryRepository.findManyUsersByIdsIncludeNameUsernameAvatar(idStrings);
    const userMap = new Map(users.map((user) => [user.id, user]));
    const items = idStrings.map((id) => userMap.get(id)).filter((u): u is UserRecordProps => Boolean(u));

    const last = requests[requests.length - 1];
    const nextCursor = hasMore && last ? encodeCursor(last.createdAt ?? new Date(0), last.id) : null;

    return new GetOutgoingRequestsOutputPort(items, nextCursor);
  }
}
