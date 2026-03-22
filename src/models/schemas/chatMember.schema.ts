import { ObjectId } from 'mongodb';

export enum EChatMemberRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member'
}

export interface IChatMember {
  _id: ObjectId;
  chatId: ObjectId;
  userId: ObjectId;
  role: EChatMemberRole;
  joinedAt: Date;
  lastReadMessageId?: ObjectId | null;
  lastReadAt?: Date | null;
}

class ChatMemberSchema implements IChatMember {
  public _id: ObjectId;
  public chatId: ObjectId;
  public userId: ObjectId;
  public role: EChatMemberRole;
  public joinedAt: Date;
  public lastReadMessageId?: ObjectId | null;
  public lastReadAt?: Date | null;

  constructor(
    data: Omit<IChatMember, '_id' | 'joinedAt'> & {
      _id?: ObjectId;
      joinedAt?: Date;
    }
  ) {
    this._id = data._id ?? new ObjectId();
    this.chatId = data.chatId;
    this.userId = data.userId;
    this.role = data.role;
    this.joinedAt = data.joinedAt ?? new Date();
    this.lastReadMessageId = data.lastReadMessageId;
    this.lastReadAt = data.lastReadAt;
  }
}

export default ChatMemberSchema;
