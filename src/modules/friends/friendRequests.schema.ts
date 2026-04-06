import { ObjectId } from 'mongodb';

export interface IFriendRequest {
  _id: ObjectId;
  fromUserId: ObjectId;
  toUserId: ObjectId;
  createdAt?: Date;
}

export class FriendRequestSchema {
  public _id: ObjectId;
  public fromUserId: ObjectId;
  public toUserId: ObjectId;
  public createdAt?: Date;

  constructor({ _id, fromUserId, toUserId, createdAt }: Omit<IFriendRequest, '_id'> & { _id?: ObjectId }) {
    this._id = _id ?? new ObjectId();
    this.fromUserId = fromUserId;
    this.toUserId = toUserId;
    this.createdAt = createdAt ?? new Date();
  }
}
