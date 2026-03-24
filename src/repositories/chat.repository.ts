import ChatSchema, { EChatType, IChat } from '@/models/schemas/chat.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { normalizeFriendshipPair } from '@/repositories/friendship.repository';
import { ObjectId } from 'mongodb';

export interface IChatRepository {
  findById(chatId: ObjectId): Promise<IChat | null>;
  findDirectByUserPair(userA: ObjectId, userB: ObjectId): Promise<IChat | null>;
  insertChat(doc: IChat): Promise<IChat>;
  updateChat(
    chatId: ObjectId,
    patch: Partial<Pick<IChat, 'name' | 'avatarMediaId' | 'updatedAt'>>
  ): Promise<IChat | null>;
  touchUpdatedAt(chatId: ObjectId, at?: Date): Promise<void>;
}

export class ChatRepository extends BaseRepository implements IChatRepository {
  findById(chatId: ObjectId): Promise<IChat | null> {
    return this.db.chatChats.findOne({ _id: chatId });
  }

  async findDirectByUserPair(userA: ObjectId, userB: ObjectId): Promise<IChat | null> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(userA, userB);
    return this.db.chatChats.findOne({
      type: EChatType.DIRECT,
      userIdLow,
      userIdHigh
    });
  }

  async insertChat(doc: IChat): Promise<IChat> {
    await this.db.chatChats.insertOne(doc);
    return doc;
  }

  static createDirectDocument(createdBy: ObjectId, peerId: ObjectId): IChat {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(createdBy, peerId);
    return new ChatSchema({
      type: EChatType.DIRECT,
      createdBy,
      userIdLow,
      userIdHigh
    });
  }

  static createGroupDocument(createdBy: ObjectId, name?: string): IChat {
    return new ChatSchema({
      type: EChatType.GROUP,
      createdBy,
      name
    });
  }

  async updateChat(
    chatId: ObjectId,
    patch: Partial<Pick<IChat, 'name' | 'avatarMediaId' | 'updatedAt'>>
  ): Promise<IChat | null> {
    const updatedAt = patch.updatedAt ?? new Date();
    const res = await this.db.chatChats.findOneAndUpdate(
      { _id: chatId },
      { $set: { ...patch, updatedAt } },
      { returnDocument: 'after' }
    );
    return res;
  }

  async touchUpdatedAt(chatId: ObjectId, at: Date = new Date()): Promise<void> {
    await this.db.chatChats.updateOne({ _id: chatId }, { $set: { updatedAt: at } });
  }
}
