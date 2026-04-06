import { ObjectId } from 'mongodb';

export interface IFriendship {
  _id: ObjectId;
  userIdLow: ObjectId;
  userIdHigh: ObjectId;
  createdAt?: Date;
}

export class FriendshipSchema {
  public _id: ObjectId;
  public userIdLow: ObjectId;
  public userIdHigh: ObjectId;
  public createdAt?: Date;

  constructor({ _id, userIdLow, userIdHigh, createdAt }: Omit<IFriendship, '_id'> & { _id?: ObjectId }) {
    this._id = _id ?? new ObjectId();
    this.userIdLow = userIdLow;
    this.userIdHigh = userIdHigh;
    this.createdAt = createdAt ?? new Date();
  }
}
