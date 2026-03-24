import { IFriendRequest } from '@/models/friendRequest.schema';
import { ObjectId } from 'mongodb';

/** Minimal user fields for friends / request lists (aligns with typical client needs). */
export class FriendUserSummaryResponseDTO {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;

  constructor(user: { _id: ObjectId; name: string; username?: string; avatar?: string }) {
    this._id = user._id.toString();
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
    this.fromUserId = row.fromUserId.toString();
    this.toUserId = row.toUserId.toString();
    this.createdAt = row.createdAt;
  }
}
