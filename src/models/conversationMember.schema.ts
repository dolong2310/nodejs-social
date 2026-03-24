import { ObjectId } from 'mongodb';

export enum EConversationMemberRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  MEMBER = 'member'
}

export interface IConversationMember {
  _id: ObjectId;
  /** Mongo field name — conversation id (stored as chatId in BSON). */
  chatId: ObjectId;
  userId: ObjectId;
  role: EConversationMemberRole;
  joinedAt: Date;
  lastReadMessageId?: ObjectId | null;
  lastReadAt?: Date | null;
}

class ConversationMemberSchema implements IConversationMember {
  public _id: ObjectId;
  public chatId: ObjectId;
  public userId: ObjectId;
  public role: EConversationMemberRole;
  public joinedAt: Date;
  public lastReadMessageId?: ObjectId | null;
  public lastReadAt?: Date | null;

  constructor(
    data: Omit<IConversationMember, '_id' | 'joinedAt'> & {
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

export default ConversationMemberSchema;
