import ChatMessageSchema, { IChatAttachment, IChatMessage } from '@/models/chatMessage.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { Filter, ObjectId } from 'mongodb';

export interface IChatMessageRepository {
  insertMessage(msg: IChatMessage): Promise<IChatMessage>;
  findById(messageId: ObjectId): Promise<IChatMessage | null>;
  findPageBeforeCursor(
    chatId: ObjectId,
    limit: number,
    before?: { createdAt: Date; _id: ObjectId }
  ): Promise<IChatMessage[]>;
}

export class ChatMessageRepository extends BaseRepository implements IChatMessageRepository {
  async insertMessage(msg: IChatMessage): Promise<IChatMessage> {
    await this.db.chatMessages.insertOne(msg);
    return msg;
  }

  findById(messageId: ObjectId): Promise<IChatMessage | null> {
    return this.db.chatMessages.findOne({ _id: messageId });
  }

  async findPageBeforeCursor(
    chatId: ObjectId,
    limit: number,
    before?: { createdAt: Date; _id: ObjectId }
  ): Promise<IChatMessage[]> {
    const filter: Filter<IChatMessage> = { chatId };
    if (before) {
      filter.$or = [
        { createdAt: { $lt: before.createdAt } },
        { createdAt: before.createdAt, _id: { $lt: before._id } }
      ];
    }
    return this.db.chatMessages.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit).toArray();
  }

  static newOutgoingMessage(
    chatId: ObjectId,
    senderId: ObjectId,
    text?: string,
    attachments?: IChatAttachment[]
  ): IChatMessage {
    return new ChatMessageSchema({ chatId, senderId, text, attachments });
  }
}
