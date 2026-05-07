import { LoggerPort } from '@/modules/core/application/ports/logger.port';
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
import { ConversationMemberMapper } from '@/modules/conversation/infrastructure/mongo/conversation-member.mapper';
import { ConversationMemberModel } from '@/modules/conversation/infrastructure/mongo/conversation-member.model';
import { ConversationModel } from '@/modules/conversation/infrastructure/mongo/conversation.model';
import { Db, MongoClient } from 'mongodb';

export class ConversationMemberRepository
  extends MongoRepositoryBase<ConversationMemberEntity, ConversationMemberModel>
  implements ConversationMemberRepositoryPort
{
  protected collectionName = 'conversation_members';

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
      conversation_id: conversationId,
      user_id: userId
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async findMembersByUsers({ conversationId, userIds }: IFindMembersByUsersInput): Promise<ConversationMemberEntity[]> {
    if (userIds.length === 0) return [];
    const results = await this.dbCollection
      .find({ conversation_id: conversationId, user_id: { $in: userIds } })
      .toArray();
    const result = results.map((record) => this.mapper.toDomain(record));
    return result;
  }

  async findMembers({ conversationIds, userId }: IFindMembersInput): Promise<ConversationMemberEntity[]> {
    if (conversationIds.length === 0) return [];
    const results = await this.dbCollection
      .find({ conversation_id: { $in: conversationIds }, user_id: userId })
      .toArray();
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
      conversation_id: conversationId,
      user_id: userId
    });
    return result.deletedCount;
  }

  async listMembers(conversationId: string): Promise<ConversationMemberEntity[]> {
    const results = await this.dbCollection.find({ conversation_id: conversationId }).toArray();
    const result = results.map((record) => this.mapper.toDomain(record));
    return result;
  }

  async updateRole({ conversationId, userId, role }: IUpdateRoleInput): Promise<ConversationMemberEntity | null> {
    const result = await this.dbCollection.findOneAndUpdate(
      { conversation_id: conversationId, user_id: userId },
      { $set: { role } },
      { returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async transferAdminRole(data: ITransferAdminRoleInput): Promise<void> {
    const { conversationId, joinedAt, oldAdminUserId, newAdminUserId } = data;
    await this.transaction(async () => {
      await this.dbCollection.updateOne(
        { conversation_id: conversationId, user_id: oldAdminUserId },
        { $set: { role: EConversationMemberRole.MANAGER } },
        { session: this.session }
      );
      await this.dbCollection.updateOne(
        { conversation_id: conversationId, user_id: newAdminUserId },
        { $set: { role: EConversationMemberRole.ADMIN } },
        { session: this.session }
      );
      await this.db
        .collection<ConversationModel>('conversations')
        .updateOne({ _id: conversationId }, { $set: { updated_at: joinedAt } }, { session: this.session });
    });
  }

  async updateReadState({
    conversationId,
    userId,
    lastReadAt,
    lastReadMessageId
  }: IUpdateReadStateInput): Promise<ConversationMemberEntity | null> {
    const result = await this.dbCollection.findOneAndUpdate(
      { conversation_id: conversationId, user_id: userId },
      { $set: { last_read_message_id: lastReadMessageId, last_read_at: lastReadAt } },
      { returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async countMembers(conversationId: string): Promise<number> {
    const result = await this.dbCollection.countDocuments({ conversation_id: conversationId });
    return result;
  }

  async countAdmins(conversationId: string): Promise<number> {
    const result = await this.dbCollection.countDocuments({
      conversation_id: conversationId,
      role: EConversationMemberRole.ADMIN
    });
    return result;
  }
}
