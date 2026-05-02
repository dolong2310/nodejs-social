import { LoggerPort } from '@/modules/core/infrastructure/logger/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { ConversationMemberEntity } from '@/modules/conversation/domain/entities/conversation-member.entity';
import { EConversationMemberRole } from '@/modules/conversation/domain/entities/conversation-member.type';
import { ConversationMemberRepositoryPort } from '@/modules/conversation/domain/repositories/conversation-member.repository';
import {
  ICreateMemberInput,
  IDeleteMemberInput,
  IFindMemberInput,
  IFindMembersByUsersInput,
  IFindMembersInput,
  ITransferAdminRoleInput,
  IUpdateReadStateInput,
  IUpdateRoleInput
} from '@/modules/conversation/domain/repositories/conversation-member.repository.type';
import { ConversationMemberMapper } from '@/modules/conversation/infrastructure/mappers/conversation-member.mapper';
import { ConversationMemberModel } from '@/modules/conversation/domain/repositories/conversation-member.model';
import { ConversationModel } from '@/modules/conversation/domain/repositories/conversation.model';
import { Db, MongoClient } from 'mongodb';

export class ConversationMemberRepository
  extends MongoRepositoryBase<ConversationMemberEntity, ConversationMemberModel>
  implements ConversationMemberRepositoryPort
{
  protected collectionName = 'conversationMembers';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: ConversationMemberMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async findMember({ conversationId, userId }: IFindMemberInput): Promise<ConversationMemberEntity | null> {
    const result = await this.dbCollection.findOne({
      conversationId,
      userId
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async findMembersByUsers({ conversationId, userIds }: IFindMembersByUsersInput): Promise<ConversationMemberEntity[]> {
    if (userIds.length === 0) return [];
    const results = await this.dbCollection.find({ conversationId, userId: { $in: userIds } }).toArray();
    const result = results.map((record) => this.mapper.toDomain(record));
    return result;
  }

  async findMembers({ conversationIds, userId }: IFindMembersInput): Promise<ConversationMemberEntity[]> {
    if (conversationIds.length === 0) return [];
    const results = await this.dbCollection.find({ conversationId: { $in: conversationIds }, userId }).toArray();
    const result = results.map((record) => this.mapper.toDomain(record));
    return result;
  }

  async createMember(data: ICreateMemberInput): Promise<ConversationMemberEntity> {
    const entity = ConversationMemberEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    await this.dbCollection.insertOne(record);
    return this.mapper.toDomain(record);
  }

  async deleteMember({ conversationId, userId }: IDeleteMemberInput): Promise<number> {
    const result = await this.dbCollection.deleteOne({
      conversationId,
      userId
    });
    return result.deletedCount;
  }

  async listMembers(conversationId: string): Promise<ConversationMemberEntity[]> {
    const results = await this.dbCollection.find({ conversationId }).toArray();
    const result = results.map((record) => this.mapper.toDomain(record));
    return result;
  }

  async updateRole({ conversationId, userId, role }: IUpdateRoleInput): Promise<ConversationMemberEntity | null> {
    const result = await this.dbCollection.findOneAndUpdate(
      { conversationId, userId },
      { $set: { role } },
      { returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async transferAdminRole(data: ITransferAdminRoleInput): Promise<void> {
    const { conversationId, joinedAt, oldAdminUserId, newAdminUserId } = data;
    await this.transaction(async () => {
      await this.dbCollection.updateOne(
        { conversationId, userId: oldAdminUserId },
        { $set: { role: EConversationMemberRole.MANAGER } },
        { session: this.session }
      );
      await this.dbCollection.updateOne(
        { conversationId, userId: newAdminUserId },
        { $set: { role: EConversationMemberRole.ADMIN } },
        { session: this.session }
      );
      await this.db
        .collection<ConversationModel>('conversations')
        .updateOne({ _id: conversationId }, { $set: { updatedAt: joinedAt } }, { session: this.session });
    });
  }

  async updateReadState({
    conversationId,
    userId,
    lastReadAt,
    lastReadMessageId
  }: IUpdateReadStateInput): Promise<ConversationMemberEntity | null> {
    const result = await this.dbCollection.findOneAndUpdate(
      { conversationId, userId },
      { $set: { lastReadMessageId, lastReadAt } },
      { returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async countMembers(conversationId: string): Promise<number> {
    const result = await this.dbCollection.countDocuments({ conversationId });
    return result;
  }

  async countAdmins(conversationId: string): Promise<number> {
    const result = await this.dbCollection.countDocuments({
      conversationId,
      role: EConversationMemberRole.ADMIN
    });
    return result;
  }
}
