import { IFriendRequest } from '@/domain/entities/friend-request.entity';

import { ICursorPaginationResult } from '@/application/common/interfaces/cursor-pagination-result.interface';

export class FindFriendUserIdsResultDTO {
  friendUserIds: string[];
  constructor(friendUserIds: string[]) {
    this.friendUserIds = friendUserIds;
  }
}

export class IsFriendOfResultDTO {
  isFriend: boolean;
  constructor(isFriend: boolean) {
    this.isFriend = isFriend;
  }
}

export class AreAllFriendsResultDTO {
  areAllFriends: boolean;
  constructor(areAllFriends: boolean) {
    this.areAllFriends = areAllFriends;
  }
}

export class SendFriendRequestResultDTO {
  friendRequest: IFriendRequest;
  constructor(friendRequest: IFriendRequest) {
    this.friendRequest = friendRequest;
  }
}

export class FriendListPaginationResultDTO implements ICursorPaginationResult<FriendUserRow> {
  items: FriendUserRow[];
  nextCursor: string | null;
  constructor(items: FriendUserRow[], nextCursor: string | null) {
    this.items = items;
    this.nextCursor = nextCursor;
  }
}

export interface FriendUserRow {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
}
