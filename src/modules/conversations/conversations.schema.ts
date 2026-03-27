import { ObjectId } from 'mongodb';

export enum EConversationType {
  DIRECT = 'direct',
  GROUP = 'group'
}

export interface IConversation {
  _id: ObjectId;
  type: EConversationType;
  createdBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  name?: string;
  avatarMediaId?: ObjectId | null;
  /** Direct only — canonical low/high pair (same ordering as friendships). */
  userIdLow?: ObjectId;
  userIdHigh?: ObjectId;
}

export class ConversationSchema implements IConversation {
  public _id: ObjectId;
  public type: EConversationType;
  public createdBy: ObjectId;
  public createdAt: Date;
  public updatedAt: Date;
  public name?: string;
  public avatarMediaId?: ObjectId | null;
  public userIdLow?: ObjectId;
  public userIdHigh?: ObjectId;

  constructor(
    data: Omit<IConversation, '_id' | 'createdAt' | 'updatedAt'> & {
      _id?: ObjectId;
      createdAt?: Date;
      updatedAt?: Date;
    }
  ) {
    const now = new Date();
    this._id = data._id ?? new ObjectId();
    this.type = data.type;
    this.createdBy = data.createdBy;
    this.createdAt = data.createdAt ?? now;
    this.updatedAt = data.updatedAt ?? now;
    this.name = data.name;
    this.avatarMediaId = data.avatarMediaId;
    this.userIdLow = data.userIdLow;
    this.userIdHigh = data.userIdHigh;
  }
}
