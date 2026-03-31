import { ObjectId } from 'mongodb';

/** Attachment metadata stored on chat messages (S3 key + client-safe fields). */
export interface IChatAttachment {
  key: string;
  mime: string;
  size: number;
  url?: string;
}

export interface IChatMessage {
  _id: ObjectId;
  chatId: ObjectId;
  senderId: ObjectId;
  text?: string;
  attachments?: IChatAttachment[];
  createdAt: Date;
}

export class ChatMessageSchema implements IChatMessage {
  public _id: ObjectId;
  public chatId: ObjectId;
  public senderId: ObjectId;
  public text?: string;
  public attachments?: IChatAttachment[];
  public createdAt: Date;

  constructor(
    data: Omit<IChatMessage, '_id' | 'createdAt'> & {
      _id?: ObjectId;
      createdAt?: Date;
    }
  ) {
    this._id = data._id ?? new ObjectId();
    this.chatId = data.chatId;
    this.senderId = data.senderId;
    this.text = data.text;
    this.attachments = data.attachments;
    this.createdAt = data.createdAt ?? new Date();
  }
}
