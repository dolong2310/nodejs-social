import { ObjectId } from 'mongodb';

export interface IConversation {
  _id: ObjectId;
  senderId: ObjectId;
  receiverId: ObjectId;
  content: string;
  lastMessage: string;
  lastMessageAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

class ConversationSchema {
  public _id: ObjectId;
  public senderId: ObjectId;
  public receiverId: ObjectId;
  public content: string;
  public lastMessage: string;
  public lastMessageAt: Date;
  public createdAt?: Date;
  public updatedAt?: Date;

  constructor(conversation: Omit<IConversation, '_id'> & { _id?: ObjectId }) {
    const date = new Date();

    this._id = conversation._id ?? new ObjectId();
    this.senderId = conversation.senderId;
    this.receiverId = conversation.receiverId;
    this.content = conversation.content;
    this.lastMessage = conversation.lastMessage;
    this.lastMessageAt = conversation.lastMessageAt;
    this.createdAt = conversation.createdAt ?? date;
    this.updatedAt = conversation.updatedAt ?? date;
  }
}

export default ConversationSchema;
