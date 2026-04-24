import { LoggerPort } from '@/application/ports/logger.port';
import { ChatMessageEntity } from '@/domain/entities/chat-message/chat-message.entity';
import { ChatMessageRepositoryPort } from '@/domain/repositories/chat-message/chat-message.repository';
import {
  ICreateMessageInput,
  IFindMessagesInput
} from '@/domain/repositories/chat-message/chat-message.repository.type';
import { MongoRepositoryBase } from '@/infrastructure/persistence/repositories/base/base.mongo.repository';
import { ChatMessageMapper } from '@/infrastructure/persistence/repositories/chat-message/chat-message.mapper';
import { ChatMessageModel } from '@/infrastructure/persistence/repositories/chat-message/chat-message.model';
import { Db, Filter, MongoClient } from 'mongodb';

export class ChatMessageRepository
  extends MongoRepositoryBase<ChatMessageEntity, ChatMessageModel>
  implements ChatMessageRepositoryPort
{
  protected collectionName = 'chatMessages';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: ChatMessageMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async createMessage(data: ICreateMessageInput): Promise<ChatMessageEntity> {
    const entity = ChatMessageEntity.create({
      conversationId: data.conversationId,
      senderId: data.senderId,
      text: data.text,
      attachments: data.attachments
    });
    const record = this.mapper.toPersistence(entity);
    await this.dbCollection.insertOne(record);
    return this.mapper.toDomain(record);
  }

  async findMessageById(id: string): Promise<ChatMessageEntity | null> {
    const result = await this.findById(id);
    return result;
  }

  async findMessages(id: string, data: IFindMessagesInput): Promise<ChatMessageEntity[]> {
    const { limit, before } = data;
    const filter: Filter<ChatMessageModel> = { conversationId: id };
    if (before) {
      // Chỉ lấy tin “đứng trước” điểm đó: createdAt < before.createdAt hoặc cùng createdAt nhưng _id < before._id.
      filter.$or = [
        { createdAt: { $lt: before.raw().createdAt } },
        { createdAt: before.raw().createdAt, _id: { $lt: before.raw().id } }
      ];
    }
    // Sort: createdAt: -1, _id: -1
    // => mới trước, cũ sau trong kết quả.
    const results = await this.dbCollection
      .find<ChatMessageModel>(filter)
      .sort({ createdAt: -1, _id: -1 })
      .limit(limit)
      .toArray();

    const result = results.map((result) => this.mapper.toDomain(result));
    return result;
  }
}
