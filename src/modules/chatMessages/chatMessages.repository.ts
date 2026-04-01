import { Injectable } from '@/decorators/injectable.decorator';
import { DateIdCursor } from '@/interfaces/types/cursor.type';
import { BaseRepository } from '@/modules/base/base.repository';
import { ChatMessageSchema, IChatAttachment, IChatMessage } from '@/modules/chatMessages/chatMessages.schema';
import { DatabaseService } from '@/providers/database/mongodb/database.service';
import { Filter, ObjectId } from 'mongodb';

export interface IChatMessageRepository {
  insertMessage(
    chatId: string,
    senderId: string,
    text?: string,
    attachments?: IChatAttachment[]
  ): Promise<IChatMessage>;
  findById(messageId: string): Promise<IChatMessage | null>;
  findPageBeforeCursor(chatId: string, limit: number, before?: DateIdCursor): Promise<IChatMessage[]>;
}

@Injectable()
export class ChatMessageRepository extends BaseRepository implements IChatMessageRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  async insertMessage(
    chatId: string,
    senderId: string,
    text?: string,
    attachments?: IChatAttachment[]
  ): Promise<IChatMessage> {
    const msg = new ChatMessageSchema({
      chatId: new ObjectId(chatId),
      senderId: new ObjectId(senderId),
      text,
      attachments
    });
    await this.db.chatMessages.insertOne(msg);
    return msg;
  }

  findById(messageId: string): Promise<IChatMessage | null> {
    return this.db.chatMessages.findOne({ _id: new ObjectId(messageId) });
  }

  async findPageBeforeCursor(chatId: string, limit: number, before?: DateIdCursor): Promise<IChatMessage[]> {
    const chatOid = new ObjectId(chatId);
    const filter: Filter<IChatMessage> = { chatId: chatOid };
    if (before) {
      // Chỉ lấy tin “đứng trước” điểm đó: createdAt < before.createdAt hoặc cùng createdAt nhưng _id < before._id.
      filter.$or = [
        { createdAt: { $lt: before.createdAt } },
        { createdAt: before.createdAt, _id: { $lt: new ObjectId(before._id) } }
      ];
    }
    // Sort: createdAt: -1, _id: -1 → mới trước, cũ sau trong kết quả.
    return this.db.chatMessages.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit).toArray();
  }
}
