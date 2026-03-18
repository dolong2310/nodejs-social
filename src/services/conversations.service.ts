import ConversationSchema, { IConversation } from '@/models/schemas/conversation.schema';
import { DatabaseSingleton } from '@/services/database.singleton';
import { ObjectId } from 'mongodb';

class ConversationService {
  constructor() {}

  private get db() {
    return DatabaseSingleton.get();
  }

  async getConversations({
    senderId,
    receiverId,
    page,
    limit
  }: {
    senderId: string;
    receiverId: string;
    page: number;
    limit: number;
  }): Promise<{ conversations: IConversation[]; totalConversations: number }> {
    const match = {
      $or: [
        { senderId: new ObjectId(senderId), receiverId: new ObjectId(receiverId) },
        { senderId: new ObjectId(receiverId), receiverId: new ObjectId(senderId) }
      ]
    };

    const conversationsPromise = this.db.conversations
      .find<IConversation>(match)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 })
      .toArray();
    const totalPromise = this.db.conversations.countDocuments(match);
    const [conversations, totalConversations] = await Promise.all([conversationsPromise, totalPromise]);

    return { conversations, totalConversations };
  }

  async createConversation({
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

export default new ConversationService();
