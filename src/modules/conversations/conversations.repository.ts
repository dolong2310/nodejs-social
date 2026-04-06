import { Injectable } from '@/decorators/injectable.decorator';
import type { IConversationMember } from '@/modules/conversations/conversationMember.schema';
import { BaseRepository } from '@/modules/base/base.repository';
import { ConversationSchema, EConversationType, IConversation } from '@/modules/conversations/conversations.schema';
import { normalizeFriendshipPair } from '@/modules/friends/friendship.repository';
import { DatabaseService } from '@/providers/database/mongodb/database.service';
import { MongoServerError, ObjectId } from 'mongodb';

export interface IConversationRepository {
  findById(conversationId: string): Promise<IConversation | null>;
  findByIds(conversationIds: string[]): Promise<IConversation[]>;
  findDirectByUserPair(userA: string, userB: string): Promise<IConversation | null>;
  insertConversation(createdBy: string, peerId: string): Promise<IConversation | null>;
  insertGroupConversationWithMembers(group: IConversation, members: IConversationMember[]): Promise<void>;
  updateConversation(
    conversationId: string,
    patch: Partial<{ name: string; avatarMediaId: string | null; updatedAt: Date }>
  ): Promise<IConversation | null>;
  touchUpdatedAt(conversationId: string, at?: Date): Promise<void>;
}

@Injectable()
export class ConversationRepository extends BaseRepository implements IConversationRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  findById(conversationId: string): Promise<IConversation | null> {
    return this.db.conversations.findOne({ _id: new ObjectId(conversationId) });
  }

  async findByIds(conversationIds: string[]): Promise<IConversation[]> {
    if (conversationIds.length === 0) return [];
    const oids = conversationIds.map((id) => new ObjectId(id));
    return this.db.conversations.find({ _id: { $in: oids } }).toArray();
  }

  async findDirectByUserPair(userA: string, userB: string): Promise<IConversation | null> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(new ObjectId(userA), new ObjectId(userB));
    return this.db.conversations.findOne({
      type: EConversationType.DIRECT,
      userIdLow,
      userIdHigh
    });
  }

  async insertConversation(createdBy: string, peerId: string): Promise<IConversation | null> {
    try {
      const a = new ObjectId(createdBy);
      const b = new ObjectId(peerId);
      const { userIdLow, userIdHigh } = normalizeFriendshipPair(a, b);
      const doc = new ConversationSchema({
        type: EConversationType.DIRECT,
        createdBy: a,
        userIdLow,
        userIdHigh
      });
      await this.db.conversations.insertOne(doc);
      return doc;
    } catch (error) {
      // Xử lý race condition khi 2 request cùng tạo
      if (error instanceof MongoServerError && error.code === 11000) {
        return null;
      }
      throw error;
    }
  }

  async insertGroupConversationWithMembers(group: IConversation, members: IConversationMember[]): Promise<void> {
    await this.db.createTransaction(async (session) => {
      await this.db.conversations.insertOne(group, { session });
      if (members.length > 0) {
        await this.db.conversationMembers.insertMany(members, { session });
      }
    });
  }

  static createGroupDocument(createdBy: string, name?: string): IConversation {
    const cb = new ObjectId(createdBy);
    return new ConversationSchema({
      type: EConversationType.GROUP,
      createdBy: cb,
      name
    });
  }

  async updateConversation(
    conversationId: string,
    patch: Partial<{ name: string; avatarMediaId: string | null; updatedAt: Date }>
  ): Promise<IConversation | null> {
    const updatedAt = patch.updatedAt ?? new Date();
    const $set: Record<string, unknown> = { updatedAt };
    if (patch.name !== undefined) {
      $set.name = patch.name;
    }
    if (patch.avatarMediaId !== undefined) {
      $set.avatarMediaId = patch.avatarMediaId === null ? null : new ObjectId(patch.avatarMediaId);
    }
    const res = await this.db.conversations.findOneAndUpdate(
      { _id: new ObjectId(conversationId) },
      { $set },
      { returnDocument: 'after' }
    );
    return res;
  }

  async touchUpdatedAt(conversationId: string, at: Date = new Date()): Promise<void> {
    await this.db.conversations.updateOne({ _id: new ObjectId(conversationId) }, { $set: { updatedAt: at } });
  }
}
