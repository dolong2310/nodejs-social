import ChatMemberSchema, { EChatMemberRole, IChatMember } from '@/models/schemas/chatMember.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { Document, ObjectId } from 'mongodb';

export interface IChatMemberRepository {
  findMembership(chatId: ObjectId, userId: ObjectId): Promise<IChatMember | null>;
  insertMember(member: IChatMember): Promise<IChatMember>;
  deleteMember(chatId: ObjectId, userId: ObjectId): Promise<number>;
  listMembers(chatId: ObjectId): Promise<IChatMember[]>;
  updateRole(chatId: ObjectId, userId: ObjectId, role: EChatMemberRole): Promise<IChatMember | null>;
  updateReadState(
    chatId: ObjectId,
    userId: ObjectId,
    lastReadMessageId: ObjectId,
    lastReadAt: Date
  ): Promise<IChatMember | null>;
  countMembers(chatId: ObjectId): Promise<number>;
  listChatsForUser(
    userId: ObjectId,
    limit: number,
    cursor?: { updatedAt: Date; chatId: ObjectId }
  ): Promise<{ chatId: ObjectId; updatedAt: Date }[]>;
}

export class ChatMemberRepository extends BaseRepository implements IChatMemberRepository {
  findMembership(chatId: ObjectId, userId: ObjectId): Promise<IChatMember | null> {
    return this.db.chatMembers.findOne({ chatId, userId });
  }

  async insertMember(member: IChatMember): Promise<IChatMember> {
    await this.db.chatMembers.insertOne(member);
    return member;
  }

  static newMember(chatId: ObjectId, userId: ObjectId, role: EChatMemberRole): IChatMember {
    return new ChatMemberSchema({ chatId, userId, role });
  }

  async deleteMember(chatId: ObjectId, userId: ObjectId): Promise<number> {
    const r = await this.db.chatMembers.deleteOne({ chatId, userId });
    return r.deletedCount;
  }

  listMembers(chatId: ObjectId): Promise<IChatMember[]> {
    return this.db.chatMembers.find({ chatId }).toArray();
  }

  async updateRole(chatId: ObjectId, userId: ObjectId, role: EChatMemberRole): Promise<IChatMember | null> {
    return this.db.chatMembers.findOneAndUpdate({ chatId, userId }, { $set: { role } }, { returnDocument: 'after' });
  }

  async updateReadState(
    chatId: ObjectId,
    userId: ObjectId,
    lastReadMessageId: ObjectId,
    lastReadAt: Date
  ): Promise<IChatMember | null> {
    return this.db.chatMembers.findOneAndUpdate(
      { chatId, userId },
      { $set: { lastReadMessageId, lastReadAt } },
      { returnDocument: 'after' }
    );
  }

  countMembers(chatId: ObjectId): Promise<number> {
    return this.db.chatMembers.countDocuments({ chatId });
  }

  async listChatsForUser(
    userId: ObjectId,
    limit: number,
    cursor?: { updatedAt: Date; chatId: ObjectId }
  ): Promise<{ chatId: ObjectId; updatedAt: Date }[]> {
    const matchCursor: Document[] = [];
    if (cursor) {
      matchCursor.push({
        $match: {
          $or: [
            { 'chat.updatedAt': { $lt: cursor.updatedAt } },
            {
              $and: [{ 'chat.updatedAt': cursor.updatedAt }, { 'chat._id': { $lt: cursor.chatId } }]
            }
          ]
        }
      });
    }

    const pipeline: Document[] = [
      { $match: { userId } },
      {
        $lookup: {
          from: 'chats',
          localField: 'chatId',
          foreignField: '_id',
          as: 'chat'
        }
      },
      { $unwind: '$chat' },
      ...matchCursor,
      { $sort: { 'chat.updatedAt': -1, 'chat._id': -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          chatId: '$chat._id',
          updatedAt: '$chat.updatedAt'
        }
      }
    ];

    return this.db.chatMembers.aggregate<{ chatId: ObjectId; updatedAt: Date }>(pipeline).toArray();
  }
}
