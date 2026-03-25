import ConversationMemberSchema, {
  EConversationMemberRole,
  IConversationMember
} from '@/models/conversationMember.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { Document, ObjectId } from 'mongodb';

export interface IConversationMemberRepository {
  findMembership(conversationId: ObjectId, userId: ObjectId): Promise<IConversationMember | null>;
  insertMember(member: IConversationMember): Promise<IConversationMember>;
  deleteMember(conversationId: ObjectId, userId: ObjectId): Promise<number>;
  listMembers(conversationId: ObjectId): Promise<IConversationMember[]>;
  updateRole(
    conversationId: ObjectId,
    userId: ObjectId,
    role: EConversationMemberRole
  ): Promise<IConversationMember | null>;
  updateReadState(
    conversationId: ObjectId,
    userId: ObjectId,
    lastReadMessageId: ObjectId,
    lastReadAt: Date
  ): Promise<IConversationMember | null>;
  countMembers(conversationId: ObjectId): Promise<number>;
  listConversationsForUser(
    userId: ObjectId,
    limit: number,
    cursor?: { updatedAt: Date; conversationId: ObjectId }
  ): Promise<{ conversationId: ObjectId; updatedAt: Date }[]>;
}

export class ConversationMemberRepository extends BaseRepository implements IConversationMemberRepository {
  findMembership(conversationId: ObjectId, userId: ObjectId): Promise<IConversationMember | null> {
    return this.db.conversationMembers.findOne({ chatId: conversationId, userId });
  }

  async insertMember(member: IConversationMember): Promise<IConversationMember> {
    await this.db.conversationMembers.insertOne(member);
    return member;
  }

  static newMember(conversationId: ObjectId, userId: ObjectId, role: EConversationMemberRole): IConversationMember {
    return new ConversationMemberSchema({ chatId: conversationId, userId, role });
  }

  async deleteMember(conversationId: ObjectId, userId: ObjectId): Promise<number> {
    const r = await this.db.conversationMembers.deleteOne({ chatId: conversationId, userId });
    return r.deletedCount;
  }

  listMembers(conversationId: ObjectId): Promise<IConversationMember[]> {
    return this.db.conversationMembers.find({ chatId: conversationId }).toArray();
  }

  async updateRole(
    conversationId: ObjectId,
    userId: ObjectId,
    role: EConversationMemberRole
  ): Promise<IConversationMember | null> {
    return this.db.conversationMembers.findOneAndUpdate(
      { chatId: conversationId, userId },
      { $set: { role } },
      { returnDocument: 'after' }
    );
  }

  async updateReadState(
    conversationId: ObjectId,
    userId: ObjectId,
    lastReadMessageId: ObjectId,
    lastReadAt: Date
  ): Promise<IConversationMember | null> {
    return this.db.conversationMembers.findOneAndUpdate(
      { chatId: conversationId, userId },
      { $set: { lastReadMessageId, lastReadAt } },
      { returnDocument: 'after' }
    );
  }

  countMembers(conversationId: ObjectId): Promise<number> {
    return this.db.conversationMembers.countDocuments({ chatId: conversationId });
  }

  async listConversationsForUser(
    userId: ObjectId,
    limit: number,
    cursor?: { updatedAt: Date; conversationId: ObjectId }
  ): Promise<{ conversationId: ObjectId; updatedAt: Date }[]> {
    const matchCursor: Document[] = [];
    if (cursor) {
      matchCursor.push({
        $match: {
          $or: [
            { 'conv.updatedAt': { $lt: cursor.updatedAt } },
            {
              $and: [{ 'conv.updatedAt': cursor.updatedAt }, { 'conv._id': { $lt: cursor.conversationId } }]
            }
          ]
        }
      });
    }

    const pipeline: Document[] = [
      { $match: { userId } },
      {
        $lookup: {
          from: 'conversations',
          localField: 'chatId',
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

    return this.db.conversationMembers.aggregate<{ conversationId: ObjectId; updatedAt: Date }>(pipeline).toArray();
  }
}
