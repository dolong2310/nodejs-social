import { ObjectId } from 'mongodb';

export interface IFollower {
  _id: ObjectId;
  userId: ObjectId;
  followedUserId: ObjectId;
  createdAt?: Date;
}

class FollowerSchema {
  public _id: ObjectId;
  public userId: ObjectId;
  public followedUserId: ObjectId;
  public createdAt?: Date;

  constructor({ _id, userId, followedUserId, createdAt }: Omit<IFollower, '_id'> & { _id?: ObjectId }) {
    this._id = _id ?? new ObjectId();
    this.userId = userId;
    this.followedUserId = followedUserId;
    this.createdAt = createdAt ?? new Date();
  }
}

export default FollowerSchema;
