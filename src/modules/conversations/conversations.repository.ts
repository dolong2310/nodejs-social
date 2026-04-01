import { Injectable } from '@/decorators/injectable.decorator';
import type { IConversationMember } from '@/modules/conversations/conversationMember.schema';
import { BaseRepository } from '@/modules/base/base.repository';
import { ConversationSchema, EConversationType, IConversation } from '@/modules/conversations/conversations.schema';
import { normalizeFriendshipPair } from '@/modules/friends/friendship.repository';
import { DatabaseService } from '@/providers/database/mongodb/database.service';
import { ObjectId } from 'mongodb';

export interface IConversationRepository {
  findById(conversationId: string): Promise<IConversation | null>;
  findByIds(conversationIds: string[]): Promise<IConversation[]>;
  findDirectByUserPair(userA: string, userB: string): Promise<IConversation | null>;
  insertConversation(doc: IConversation): Promise<IConversation>;
  /** Atomic create: group conversation + initial members (MongoDB multi-document transaction). */
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

  async insertConversation(doc: IConversation): Promise<IConversation> {
    await this.db.conversations.insertOne(doc);
    return doc;
  }

  async insertGroupConversationWithMembers(group: IConversation, members: IConversationMember[]): Promise<void> {
    await this.db.createTransaction(async (session) => {
      await this.db.conversations.insertOne(group, { session });
      if (members.length > 0) {
        await this.db.conversationMembers.insertMany(members, { session });
      }
    });
  }

  static createDirectDocument(createdBy: string, peerId: string): IConversation {
    const a = new ObjectId(createdBy);
    const b = new ObjectId(peerId);
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(a, b);
    return new ConversationSchema({
      type: EConversationType.DIRECT,
      createdBy: a,
      userIdLow,
      userIdHigh
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
