import { ConversationMemberEntity } from '@/modules/conversation/domain/entities/conversation-member.entity';
import { EConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { ConversationEntity } from '@/modules/conversation/domain/entities/conversation.entity';
import { EConversationType } from '@/modules/conversation/domain/entities/conversation.type';
import { ConversationRepositoryPort } from '@/modules/conversation/domain/repositories/conversation.repository';
import {
  ICreateGroupConversationInput,
  ITouchUpdatedAtInput,
  IUpdateConversationInput
} from '@/modules/conversation/domain/repositories/conversation.repository.type';
import { ConversationMemberMapper } from '@/modules/conversation/infrastructure/persistence/mongo/conversation-member.mapper';
import { ConversationMemberModel } from '@/modules/conversation/infrastructure/persistence/mongo/conversation-member.model';
import { ConversationMapper } from '@/modules/conversation/infrastructure/persistence/mongo/conversation.mapper';
import { ConversationModel } from '@/modules/conversation/infrastructure/persistence/mongo/conversation.model';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { normalizeFriendshipPair } from '@/modules/relationship/infrastructure/persistence/mongo/friendship.impl.repository';
import { Db, MongoClient, MongoServerError } from 'mongodb';

export class ConversationRepository
  extends MongoRepositoryBase<ConversationEntity, ConversationModel>
  implements ConversationRepositoryPort
{
  protected collectionName = 'conversations';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: ConversationMapper,
    protected readonly conversationMemberMapper: ConversationMemberMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async findConversationById(id: string): Promise<ConversationEntity | null> {
    const result = await this.findById(id);
    return result;
  }

  async findConversationsByIds(ids: string[]): Promise<ConversationEntity[]> {
    const result = await this.findAllByIds(ids);
    return result;
  }

  async findDirectConversationByUserPair(userIdA: string, userIdB: string): Promise<ConversationEntity | null> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(userIdA, userIdB);
    const result = await this.dbCollection.findOne({
      type: EConversationType.DIRECT,
      user_id_low: userIdLow,
      user_id_high: userIdHigh
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async createDirectConversation(createdBy: string, peerId: string): Promise<ConversationEntity | null> {
    try {
      const { userIdLow, userIdHigh } = normalizeFriendshipPair(createdBy, peerId);
      const entity = ConversationEntity.create({
        type: EConversationType.DIRECT,
        createdBy,
        userIdLow,
        userIdHigh
      });
      const record = this.mapper.toPersistence(entity);
      await this.dbCollection.insertOne(record);
      return this.mapper.toDomain(record);
    } catch (error) {
      // Xử lý race condition khi 2 request cùng tạo
      if (error instanceof MongoServerError && error.code === 11000) {
        return null;
      }
      throw error;
    }
  }

  async createGroupConversation(data: ICreateGroupConversationInput): Promise<ConversationEntity> {
    const { name, createdBy, memberIds } = data;
    const group = ConversationEntity.create({
      type: EConversationType.GROUP,
      createdBy,
      name
    });

    // thêm admin và members vào group
    const admin = ConversationMemberEntity.create({
      conversationId: group.id.toString(),
      userId: createdBy,
      role: EConversationMemberRole.ADMIN,
      joinedAt: new Date(),
      lastReadAt: new Date(),
      lastReadMessageId: null
    });

    const members = memberIds.map((memberId) =>
      ConversationMemberEntity.create({
        conversationId: group.id.toString(),
        userId: memberId,
        role: EConversationMemberRole.MEMBER,
        joinedAt: new Date(),
        lastReadAt: new Date(),
        lastReadMessageId: null
      })
    );

    const allMembers: ConversationMemberEntity[] = [admin, ...members];

    // tạo transaction thực hiện 2 operation: insert group và insert members
    await this.transaction(async () => {
      const groupRecord = this.mapper.toPersistence(group);
      await this.dbCollection.insertOne(groupRecord, { session: this.session });
      if (allMembers.length > 0) {
        const memberRecords = allMembers.map((member) => this.conversationMemberMapper.toPersistence(member));
        await this.db
          .collection<ConversationMemberModel>('conversation_members')
          .insertMany(memberRecords, { session: this.session });
      }
    });

    return group;
  }

  async updateConversation(id: string, data: IUpdateConversationInput): Promise<ConversationEntity | null> {
    const $set: Record<string, unknown> = { updated_at: new Date() };
    if (data.name !== undefined) {
      $set.name = data.name;
    }
    if (data.avatarMediaId !== undefined) {
      $set.avatar_media_id = data.avatarMediaId === null ? null : data.avatarMediaId;
    }
    const result = await this.dbCollection.findOneAndUpdate({ _id: id }, { $set }, { returnDocument: 'after' });
    return result ? this.mapper.toDomain(result) : null;
  }

  async touchUpdatedAt(id: string, data: ITouchUpdatedAtInput): Promise<void> {
    await this.dbCollection.updateOne({ _id: id }, { $set: { updated_at: data.updatedAt } });
  }
}
