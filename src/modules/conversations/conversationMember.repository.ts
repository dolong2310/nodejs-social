import { Injectable } from '@/decorators';
import { BaseRepository, ConversationMemberSchema, EConversationMemberRole, IConversationMember } from '@/modules';
import { Document, ObjectId } from 'mongodb';

export interface IConversationMemberRepository {
  findMembership(conversationId: string, userId: string): Promise<IConversationMember | null>;
  findMembershipsByUsers(conversationId: string, userIds: string[]): Promise<IConversationMember[]>;
  findMemberships(conversationIds: string[], userId: string): Promise<IConversationMember[]>;
  insertMember(member: IConversationMember): Promise<IConversationMember>;
  deleteMember(conversationId: string, userId: string): Promise<number>;
  listMembers(conversationId: string): Promise<IConversationMember[]>;
  countAdmins(conversationId: string): Promise<number>;
  updateRole(
    conversationId: string,
    userId: string,
    role: EConversationMemberRole
  ): Promise<IConversationMember | null>;
  transferAdminRole(conversationId: string, oldAdminUserId: string, newAdminUserId: string, at?: Date): Promise<void>;
  updateReadState(
    conversationId: string,
    userId: string,
    lastReadMessageId: string,
    lastReadAt: Date
  ): Promise<IConversationMember | null>;
  countMembers(conversationId: string): Promise<number>;
  listConversationsForUser(
    userId: string,
    limit: number,
    cursor?: { updatedAt: Date; conversationId: string }
  ): Promise<{ conversationId: ObjectId; updatedAt: Date }[]>;
}

@Injectable()
export class ConversationMemberRepository extends BaseRepository implements IConversationMemberRepository {
  findMembership(conversationId: string, userId: string): Promise<IConversationMember | null> {
    return this.db.conversationMembers.findOne({
      chatId: new ObjectId(conversationId),
      userId: new ObjectId(userId)
    });
  }

  async findMembershipsByUsers(conversationId: string, userIds: string[]): Promise<IConversationMember[]> {
    if (userIds.length === 0) return [];
    const chatOid = new ObjectId(conversationId);
    const userOids = userIds.map((id) => new ObjectId(id));
    return this.db.conversationMembers.find({ chatId: chatOid, userId: { $in: userOids } }).toArray();
  }

  async findMemberships(conversationIds: string[], userId: string): Promise<IConversationMember[]> {
    if (conversationIds.length === 0) return [];
    const userOid = new ObjectId(userId);
    const chatOids = conversationIds.map((id) => new ObjectId(id));
    return this.db.conversationMembers.find({ chatId: { $in: chatOids }, userId: userOid }).toArray();
  }

  async insertMember(member: IConversationMember): Promise<IConversationMember> {
    await this.db.conversationMembers.insertOne(member);
    return member;
  }

  static newMember(conversationId: string, userId: string, role: EConversationMemberRole): IConversationMember {
    return new ConversationMemberSchema({
      chatId: new ObjectId(conversationId),
      userId: new ObjectId(userId),
      role
    });
  }

  async deleteMember(conversationId: string, userId: string): Promise<number> {
    const r = await this.db.conversationMembers.deleteOne({
      chatId: new ObjectId(conversationId),
      userId: new ObjectId(userId)
    });
    return r.deletedCount;
  }

  listMembers(conversationId: string): Promise<IConversationMember[]> {
    return this.db.conversationMembers.find({ chatId: new ObjectId(conversationId) }).toArray();
  }

  async updateRole(
    conversationId: string,
    userId: string,
    role: EConversationMemberRole
  ): Promise<IConversationMember | null> {
    return this.db.conversationMembers.findOneAndUpdate(
      { chatId: new ObjectId(conversationId), userId: new ObjectId(userId) },
      { $set: { role } },
      { returnDocument: 'after' }
    );
  }

  async transferAdminRole(
    conversationId: string,
    oldAdminUserId: string,
    newAdminUserId: string,
    at: Date = new Date()
  ): Promise<void> {
    const chatId = new ObjectId(conversationId);
    const oldAdminId = new ObjectId(oldAdminUserId);
    const newAdminId = new ObjectId(newAdminUserId);
    await this.db.createTransaction(async (session) => {
      await this.db.conversationMembers.updateOne(
        { chatId, userId: oldAdminId },
        { $set: { role: EConversationMemberRole.MANAGER } },
        { session }
      );
      await this.db.conversationMembers.updateOne(
        { chatId, userId: newAdminId },
        { $set: { role: EConversationMemberRole.ADMIN } },
        { session }
      );
      await this.db.conversations.updateOne({ _id: chatId }, { $set: { updatedAt: at } }, { session });
    });
  }

  async updateReadState(
    conversationId: string,
    userId: string,
    lastReadMessageId: string,
    lastReadAt: Date
  ): Promise<IConversationMember | null> {
    return this.db.conversationMembers.findOneAndUpdate(
      { chatId: new ObjectId(conversationId), userId: new ObjectId(userId) },
      { $set: { lastReadMessageId: new ObjectId(lastReadMessageId), lastReadAt } },
      { returnDocument: 'after' }
    );
  }

  countMembers(conversationId: string): Promise<number> {
    return this.db.conversationMembers.countDocuments({ chatId: new ObjectId(conversationId) });
  }

  async countAdmins(conversationId: string): Promise<number> {
    return this.db.conversationMembers.countDocuments({
      chatId: new ObjectId(conversationId),
      role: EConversationMemberRole.ADMIN
    });
  }

  async listConversationsForUser(
    userId: string,
    limit: number,
    cursor?: { updatedAt: Date; conversationId: string }
  ): Promise<{ conversationId: ObjectId; updatedAt: Date }[]> {
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
