import { ChatMessageEntity } from '@/modules/conversation/domain/entities/chat-message.entity';
import { ChatMessageRepositoryPort } from '@/modules/conversation/domain/repositories/chat-message.repository';
import {
  ICreateMessageInput,
  IFindMessagesInput
} from '@/modules/conversation/domain/repositories/chat-message.repository.type';
import { ChatMessageMapper } from '@/modules/conversation/infrastructure/persistence/mongo/chat-message.mapper';
import { ChatMessageModel } from '@/modules/conversation/infrastructure/persistence/mongo/chat-message.model';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { Db, Filter, MongoClient } from 'mongodb';

export class ChatMessageRepository
  extends MongoRepositoryBase<ChatMessageEntity, ChatMessageModel>
  implements ChatMessageRepositoryPort
{
  protected collectionName = 'chat_messages';

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
    const filter: Filter<ChatMessageModel> = { conversation_id: id };
    if (before) {
      // Chỉ lấy tin “đứng trước” điểm đó: createdAt < before.createdAt hoặc cùng createdAt nhưng _id < before._id.
      filter.$or = [
        { created_at: { $lt: before.raw().createdAt } },
        { created_at: before.raw().createdAt, _id: { $lt: before.raw().id } }
      ];
    }
    // Sort: createdAt: -1, _id: -1
    // => mới trước, cũ sau trong kết quả.
    const results = await this.dbCollection
      .find<ChatMessageModel>(filter)
      .sort({ created_at: -1, _id: -1 })
      .limit(limit)
      .toArray();

    const result = results.map((result) => this.mapper.toDomain(result));
    return result;
  }
}
