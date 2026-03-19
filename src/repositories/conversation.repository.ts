/*
 * Conversation Repository
 * This file contains the ConversationRepository class which implements IConversationRepository interface.
 * It provides methods to interact with the conversation data in the database.
 */

import { IGetConversationsRequestParams, IGetConversationsRequestQuery } from '@/models/requests/conversation.request';
import ConversationSchema, { IConversation } from '@/models/schemas/conversation.schema';
import { BaseRepository } from '@/repositories/base.repository';
import { ObjectId } from 'mongodb';

export interface IConversationRepository {
  findConversations({
    senderId,
    receiverId,
    page,
    limit
  }: IGetConversationsRequestParams & IGetConversationsRequestQuery & { senderId: string }): Promise<IConversation[]>;
  countConversations({ senderId, receiverId }: IGetConversationsRequestParams & { senderId: string }): Promise<number>;
  create({
    senderId,
    receiverId,
    content,
    lastMessage
  }: {
    senderId: string;
    receiverId: string;
    content: string;
    lastMessage: string;
  }): Promise<IConversation>;
}

export class ConversationRepository extends BaseRepository implements IConversationRepository {
  findConversations({
    senderId,
    receiverId,
    page,
    limit
  }: IGetConversationsRequestParams & IGetConversationsRequestQuery & { senderId: string }): Promise<IConversation[]> {
    const match = {
      $or: [
        { senderId: new ObjectId(senderId), receiverId: new ObjectId(receiverId) },
        { senderId: new ObjectId(receiverId), receiverId: new ObjectId(senderId) }
      ]
    };
    return this.findManyWithPagination<IConversation>(
      this.db.conversations,
      match,
      { createdAt: -1 },
      { page: Number(page), limit: Number(limit) }
    );
  }

  countConversations({ senderId, receiverId }: { senderId: string; receiverId: string }): Promise<number> {
    const match = {
      $or: [
        { senderId: new ObjectId(senderId), receiverId: new ObjectId(receiverId) },
        { senderId: new ObjectId(receiverId), receiverId: new ObjectId(senderId) }
      ]
    };
    return this.count(this.db.conversations, match);
  }

  async create({
    senderId,
    receiverId,
    content,
    lastMessage
  }: {
    senderId: string;
    receiverId: string;
    content: string;
    lastMessage: string;
  }): Promise<IConversation> {
    const conversation = new ConversationSchema({
      senderId: new ObjectId(senderId),
      receiverId: new ObjectId(receiverId),
      content,
      lastMessage,
      lastMessageAt: new Date()
    });
    await this.db.conversations.insertOne(conversation);
    return conversation;
  }
}
