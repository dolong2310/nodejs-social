import { FriendUserRow } from '@/application/dtos/friend/friend.result.dto';

export class ListBlockedUsersResultDTO {
  users: FriendUserRow[];
  total: number;
  constructor(payload: { users: FriendUserRow[]; total: number }) {
    this.users = payload.users;
    this.total = payload.total;
  }
}
