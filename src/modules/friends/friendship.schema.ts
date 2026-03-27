import { ObjectId } from 'mongodb';

/**
 * Undirected friendship edge on the social DB (D-04).
 * Invariant: `userIdLow` and `userIdHigh` must satisfy `userIdLow < userIdHigh` by BSON ObjectId
 * byte order (see `normalizeFriendshipPair` in friendship repository). Enforce before insert.
 */
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
