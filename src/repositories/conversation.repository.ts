import ConversationSchema, { EConversationType, IConversation } from '@/models/conversation.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { normalizeFriendshipPair } from '@/repositories/friendship.repository';
import { ObjectId } from 'mongodb';

export interface IConversationRepository {
  findById(conversationId: ObjectId): Promise<IConversation | null>;
  findDirectByUserPair(userA: ObjectId, userB: ObjectId): Promise<IConversation | null>;
  insertConversation(doc: IConversation): Promise<IConversation>;
  updateConversation(
    conversationId: ObjectId,
    patch: Partial<Pick<IConversation, 'name' | 'avatarMediaId' | 'updatedAt'>>
  ): Promise<IConversation | null>;
  touchUpdatedAt(conversationId: ObjectId, at?: Date): Promise<void>;
}

export class ConversationRepository extends BaseRepository implements IConversationRepository {
  findById(conversationId: ObjectId): Promise<IConversation | null> {
    return this.db.conversations.findOne({ _id: conversationId });
  }

  async findDirectByUserPair(userA: ObjectId, userB: ObjectId): Promise<IConversation | null> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(userA, userB);
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

  static createDirectDocument(createdBy: ObjectId, peerId: ObjectId): IConversation {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(createdBy, peerId);
    return new ConversationSchema({
      type: EConversationType.DIRECT,
      createdBy,
      userIdLow,
      userIdHigh
    });
  }

  static createGroupDocument(createdBy: ObjectId, name?: string): IConversation {
    return new ConversationSchema({
      type: EConversationType.GROUP,
      createdBy,
      name
    });
  }

  async updateConversation(
    conversationId: ObjectId,
    patch: Partial<Pick<IConversation, 'name' | 'avatarMediaId' | 'updatedAt'>>
  ): Promise<IConversation | null> {
    const updatedAt = patch.updatedAt ?? new Date();
    const res = await this.db.conversations.findOneAndUpdate(
      { _id: conversationId },
      { $set: { ...patch, updatedAt } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async touchUpdatedAt(conversationId: ObjectId, at: Date = new Date()): Promise<void> {
    await this.db.conversations.updateOne({ _id: conversationId }, { $set: { updatedAt: at } });
  }
}
