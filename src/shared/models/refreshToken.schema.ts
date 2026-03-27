import { ObjectId } from 'mongodb';

export interface IRefreshToken {
  _id: ObjectId;
  token: string;
  userId: ObjectId;
  createdAt?: Date;
}

export class RefreshTokenSchema {
  public _id: ObjectId;
  public token: string;
  public userId: ObjectId;
  public createdAt?: Date;

  constructor({ _id, token, userId, createdAt }: Omit<IRefreshToken, '_id'> & { _id?: ObjectId }) {
    this._id = _id ?? new ObjectId();
    this.token = token;
    this.userId = userId;
    this.createdAt = createdAt ?? new Date();
  }
}
