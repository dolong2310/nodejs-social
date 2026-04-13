import { IConversationMember } from '@/domain/entities/conversation-member.entity';
import { EConversationMemberRole } from '@/domain/enums/conversation-member.enum';
import {
  ICountAdminsInput,
  ICountMembersInput,
  ICreateMemberInput,
  IDeleteMemberInput,
  IFindMemberInput,
  IFindMembersByUsersInput,
  IFindMembersInput,
  IListConversationsForUserInput,
  IListConversationsForUserOutput,
  IListMembersInput,
  ITransferAdminRoleInput,
  IUpdateReadStateInput,
  IUpdateRoleInput
} from '@/domain/repositories/conversation-member/conversation-member.interface';
import { IConversationMemberRepository } from '@/domain/repositories/conversation-member/conversation-member.repository';

import { ConversationMemberMapper } from '@/infrastructure/persistence/mapper/conversation-member.mapper';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { BaseRepository } from '@/infrastructure/persistence/repositories/base.repository';

import { Document, ObjectId } from 'mongodb';

export class ConversationMemberRepository extends BaseRepository implements IConversationMemberRepository {
  constructor(
    db: DatabaseService,
    private readonly mapper: ConversationMemberMapper
  ) {
    super(db);
  }

  async findMember(data: IFindMemberInput): Promise<IConversationMember | null> {
    const record = this.mapper.toPersistence(data);
    const result = await this.db.conversationMembers.findOne({
      conversationId: record.conversationId,
      userId: record.userId
    });
    return result ? this.mapper.toDomain(result) : null;
  }

  async findMembersByUsers(data: IFindMembersByUsersInput): Promise<IConversationMember[]> {
    const record = this.mapper.toPersistence(data);
    if (data.userIds.length === 0) return [];
    const userOids = data.userIds.map((id) => new ObjectId(id));
    const results = await this.db.conversationMembers
      .find({ conversationId: record.conversationId, userId: { $in: userOids } })
      .toArray();
    const result = results.map((r) => this.mapper.toDomain(r));
    return result;
  }

  async findMembers(data: IFindMembersInput): Promise<IConversationMember[]> {
    const record = this.mapper.toPersistence(data);
    if (data.conversationIds.length === 0) return [];
    const chatOids = data.conversationIds.map((id) => new ObjectId(id));
    const results = await this.db.conversationMembers
      .find({ conversationId: { $in: chatOids }, userId: record.userId })
      .toArray();
    const result = results.map((r) => this.mapper.toDomain(r));
    return result;
  }

  async createMember(data: ICreateMemberInput): Promise<IConversationMember> {
    const record = this.mapper.toPersistence(data);
    await this.db.conversationMembers.insertOne(record);
    return this.mapper.toDomain(record);
  }

  async deleteMember(data: IDeleteMemberInput): Promise<number> {
    const record = this.mapper.toPersistence(data);
    const r = await this.db.conversationMembers.deleteOne({
      conversationId: record.conversationId,
      userId: record.userId
    });
    return r.deletedCount;
  }

  async listMembers(data: IListMembersInput): Promise<IConversationMember[]> {
    const record = this.mapper.toPersistence(data);
    const results = await this.db.conversationMembers.find({ conversationId: record.conversationId }).toArray();
    const result = results.map((r) => this.mapper.toDomain(r));
    return result;
  }

  async updateRole(data: IUpdateRoleInput): Promise<IConversationMember | null> {
    const record = this.mapper.toPersistence(data);
    const result = await this.db.conversationMembers.findOneAndUpdate(
      { conversationId: record.conversationId, userId: record.userId },
      { $set: { role: record.role } },
      { returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async transferAdminRole(data: ITransferAdminRoleInput): Promise<void> {
    const { oldAdminUserId, newAdminUserId } = data;
    const record = this.mapper.toPersistence(data);
    const oldAdminId = new ObjectId(oldAdminUserId);
    const newAdminId = new ObjectId(newAdminUserId);
    await this.db.createTransaction(async (session) => {
      await this.db.conversationMembers.updateOne(
        { conversationId: record.conversationId, userId: oldAdminId },
        { $set: { role: EConversationMemberRole.MANAGER } },
        { session }
      );
      await this.db.conversationMembers.updateOne(
        { conversationId: record.conversationId, userId: newAdminId },
        { $set: { role: EConversationMemberRole.ADMIN } },
        { session }
      );
      await this.db.conversations.updateOne(
        { _id: record.conversationId },
        { $set: { updatedAt: record.joinedAt } },
        { session }
      );
    });
  }

  async updateReadState(data: IUpdateReadStateInput): Promise<IConversationMember | null> {
    const record = this.mapper.toPersistence(data);
    const result = await this.db.conversationMembers.findOneAndUpdate(
      { conversationId: record.conversationId, userId: record.userId },
      { $set: { lastReadMessageId: record.lastReadMessageId, lastReadAt: record.lastReadAt } },
      { returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async countMembers(data: ICountMembersInput): Promise<number> {
    const record = this.mapper.toPersistence(data);
    const result = await this.db.conversationMembers.countDocuments({ conversationId: record.conversationId });
    return result;
  }

  async countAdmins(data: ICountAdminsInput): Promise<number> {
    const record = this.mapper.toPersistence(data);
    const result = await this.db.conversationMembers.countDocuments({
      conversationId: record.conversationId,
      role: EConversationMemberRole.ADMIN
    });
    return result;
  }

  async listConversationsForUser(data: IListConversationsForUserInput): Promise<IListConversationsForUserOutput[]> {
    const { userId, limit, cursor } = data;
    const userOid = new ObjectId(userId);
    const matchCursor: Document[] = [];
    if (cursor) {
      const cursorCid = new ObjectId(cursor.conversationId);
      matchCursor.push({
        $match: {
          $or: [
            { 'conv.updatedAt': { $lt: cursor.updatedAt } },
            {
              $and: [{ 'conv.updatedAt': cursor.updatedAt }, { 'conv._id': { $lt: cursorCid } }]
            }
          ]
        }
      });
    }

    const pipeline: Document[] = [
      { $match: { userId: userOid } },
      {
        $lookup: {
          from: 'conversations',
          localField: 'conversationId',
          foreignField: '_id',
          as: 'conv'
        }
      },
      { $unwind: '$conv' },
      ...matchCursor,
      { $sort: { 'conv.updatedAt': -1, 'conv._id': -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          conversationId: '$conv._id',
          updatedAt: '$conv.updatedAt'
        }
      }
    ];

    return this.db.conversationMembers.aggregate<IListConversationsForUserOutput>(pipeline).toArray();
  }
}
