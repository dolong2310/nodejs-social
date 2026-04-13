import { IChatMessage } from '@/domain/entities/chat-message.entity';
import {
  ICreateMessageInput,
  IFindMessageByIdInput,
  IFindMessagesInput
} from '@/domain/repositories/chat-message/chat-message.interface';
import { IChatMessageRepository } from '@/domain/repositories/chat-message/chat-message.repository';
import { ChatMessageMapper } from '@/infrastructure/persistence/mapper/chat-message.mapper';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { IChatMessageModel } from '@/infrastructure/persistence/mongodb/models/chat-message.model';
import { BaseRepository } from '@/infrastructure/persistence/repositories/base.repository';

import { Filter, ObjectId } from 'mongodb';

export class ChatMessageRepository extends BaseRepository implements IChatMessageRepository {
  constructor(
    db: DatabaseService,
    private readonly chatMessageMapper: ChatMessageMapper
  ) {
    super(db);
  }

  async createMessage(data: ICreateMessageInput): Promise<IChatMessage> {
    const record = this.chatMessageMapper.toPersistence(data);
    await this.db.chatMessages.insertOne(record);
    return this.chatMessageMapper.toDomain(record);
  }

  async findMessageById(data: IFindMessageByIdInput): Promise<IChatMessage | null> {
    const record = this.chatMessageMapper.toPersistence(data);
    const result = await this.db.chatMessages.findOne({ _id: record._id });
    return result ? this.chatMessageMapper.toDomain(result) : null;
  }

  async findMessages(data: IFindMessagesInput): Promise<IChatMessage[]> {
    const { conversationId, limit, before } = data;
    const chatOid = new ObjectId(conversationId);
    const filter: Filter<IChatMessageModel> = { conversationId: chatOid };
    if (before) {
      // Chỉ lấy tin “đứng trước” điểm đó: createdAt < before.createdAt hoặc cùng createdAt nhưng _id < before._id.
      filter.$or = [
        { createdAt: { $lt: before.createdAt } },
        { createdAt: before.createdAt, _id: { $lt: new ObjectId(before.id) } }
      ];
    }
    // Sort: createdAt: -1, _id: -1 → mới trước, cũ sau trong kết quả.
    const results = await this.db.chatMessages.find(filter).sort({ createdAt: -1, _id: -1 }).limit(limit).toArray();

    const result = results.map((result) => this.chatMessageMapper.toDomain(result));
    return result;
  }
}
