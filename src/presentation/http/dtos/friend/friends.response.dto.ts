import { IFriendRequest } from '@/domain/entities/friend-request.entity';

export class FriendUserSummaryResponseDTO {
  id: string;
  name: string;
  username?: string;
  avatar?: string;

  constructor(user: { id: string; name: string; username?: string; avatar?: string }) {
    this.id = user.id;
    this.name = user.name;
    this.username = user.username;
    this.avatar = user.avatar;
  }
}

export class FriendRequestRowResponseDTO {
  fromUserId: string;
  toUserId: string;
  createdAt?: Date;

  constructor(row: IFriendRequest) {
    this.fromUserId = row.fromUserId;
    this.toUserId = row.toUserId;
    this.createdAt = row.createdAt;
  }
}
