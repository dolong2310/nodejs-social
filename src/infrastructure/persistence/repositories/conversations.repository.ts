import { ConversationMemberEntity, type IConversationMember } from '@/domain/entities/conversation-member.entity';
import { ConversationEntity, IConversation } from '@/domain/entities/conversation.entity';
import { EConversationMemberRole } from '@/domain/enums/conversation-member.enum';
import { EConversationType } from '@/domain/enums/conversation.enum';
import {
  ICreateConversationInput,
  ICreateGroupConversationWithMembersInput,
  IFindConversationByIdInput,
  IFindConversationsByIdsInput,
  IFindDirectConversationByUserPairInput,
  ITouchUpdatedAtInput,
  IUpdateConversationInput
} from '@/domain/repositories/conversation/conversation.interface';
import { IConversationRepository } from '@/domain/repositories/conversation/conversation.repository';

import { ConversationMemberMapper } from '@/infrastructure/persistence/mapper/conversation-member.mapper';
import { ConversationMapper } from '@/infrastructure/persistence/mapper/conversation.mapper';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { IConversationModel } from '@/infrastructure/persistence/mongodb/models/conversation.model';
import { BaseRepository } from '@/infrastructure/persistence/repositories/base.repository';
import { normalizeFriendshipPair } from '@/infrastructure/persistence/repositories/friendship.repository';

import { MongoServerError, ObjectId } from 'mongodb';

export class ConversationRepository extends BaseRepository implements IConversationRepository {
  constructor(
    db: DatabaseService,
    private readonly mapper: ConversationMapper,
    private readonly conversationMemberMapper: ConversationMemberMapper
  ) {
    super(db);
  }

  async findConversationById(data: IFindConversationByIdInput): Promise<IConversation | null> {
    const record = this.mapper.toPersistence(data);
    const result = await this.db.conversations.findOne({ _id: record._id });
    return result ? this.mapper.toDomain(result) : null;
  }

  async findConversationsByIds(data: IFindConversationsByIdsInput): Promise<IConversation[]> {
    const { conversationIds } = data;
    if (conversationIds.length === 0) return [];
    const oids = conversationIds.map((id) => new ObjectId(id));
    const results = await this.db.conversations.find({ _id: { $in: oids } }).toArray();
    const result = results.map((r) => this.mapper.toDomain(r));
    return result;
  }

  async findDirectConversationByUserPair(data: IFindDirectConversationByUserPairInput): Promise<IConversation | null> {
    const { aUserId, bUserId } = data;
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(new ObjectId(aUserId), new ObjectId(bUserId));
    const result = await this.db.conversations.findOne({
      type: EConversationType.DIRECT,
      userIdLow,
      userIdHigh
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async createConversation(data: ICreateConversationInput): Promise<IConversation | null> {
    try {
      const record = this.mapper.toPersistence(data);
      const { userIdLow, userIdHigh } = normalizeFriendshipPair(record.createdBy, new ObjectId(data.peerId));
      const doc: IConversationModel = {
        type: EConversationType.DIRECT,
        createdBy: record.createdBy,
        userIdLow,
        userIdHigh,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await this.db.conversations.insertOne(doc);
      return this.mapper.toDomain(doc);
    } catch (error) {
      // Xử lý race condition khi 2 request cùng tạo
      if (error instanceof MongoServerError && error.code === 11000) {
        return null;
      }
      throw error;
    }
  }

  async createGroupConversationWithMembers(data: ICreateGroupConversationWithMembersInput): Promise<IConversation> {
    const { adminId, memberIds, groupName } = data;
    const group = ConversationEntity.create({
      id: '123',
      type: EConversationType.GROUP,
      createdBy: adminId,
      name: groupName,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // thêm admin và members vào group
    const admin: IConversationMember = ConversationMemberEntity.create({
      id: '123',
      conversationId: group.id,
      userId: adminId,
      role: EConversationMemberRole.ADMIN,
      joinedAt: new Date(),
      lastReadAt: new Date(),
      lastReadMessageId: null
    });

    const members: IConversationMember[] = memberIds.map((memberId) =>
      ConversationMemberEntity.create({
        id: '123',
        conversationId: group.id,
        userId: memberId,
        role: EConversationMemberRole.MEMBER,
        joinedAt: new Date(),
        lastReadAt: new Date(),
        lastReadMessageId: null
      })
    );

    const allMembers: IConversationMember[] = [admin, ...members];

    // tạo transaction thực hiện 2 operation: insert group và insert members
    await this.db.createTransaction(async (session) => {
      const groupDoc: IConversationModel = this.mapper.toPersistence(group);
      await this.db.conversations.insertOne(groupDoc, { session });
      if (allMembers.length > 0) {
        const membersDocs = allMembers.map((member) => this.conversationMemberMapper.toPersistence(member));
        await this.db.conversationMembers.insertMany(membersDocs, { session });
      }
    });

    return group;
  }

  async updateConversation(data: IUpdateConversationInput): Promise<IConversation | null> {
    const record = this.mapper.toPersistence(data);
    const updatedAt = record.updatedAt ?? new Date();
    const $set: Record<string, unknown> = { updatedAt };
    if (record.name !== undefined) {
      $set.name = record.name;
    }
    if (record.avatarMediaId !== undefined) {
      $set.avatarMediaId = record.avatarMediaId === null ? null : record.avatarMediaId;
    }
    const result = await this.db.conversations.findOneAndUpdate(
      { _id: record._id },
      { $set },
      { returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async touchUpdatedAt(data: ITouchUpdatedAtInput): Promise<void> {
    const record = this.mapper.toPersistence(data);
    await this.db.conversations.updateOne({ _id: record._id }, { $set: { updatedAt: record.updatedAt } });
  }
}
