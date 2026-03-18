import { IConversation } from '@/models/schemas/conversation.schema';
import { IConversationRepository } from '@/repositories/conversation.repository';

export interface IConversationsService {
  getConversations(payload: {
    senderId: string;
    receiverId: string;
    page: number;
    limit: number;
  }): Promise<{ conversations: IConversation[]; totalConversations: number }>;
  createConversation(payload: {
    senderId: string;
    receiverId: string;
    content: string;
    lastMessage: string;
  }): Promise<IConversation>;
}

class ConversationService implements IConversationsService {
  constructor(private readonly conversationRepository: IConversationRepository) {}

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
    const conversationsPromise = this.conversationRepository.findConversations({ senderId, receiverId, page, limit });
    const totalPromise = this.conversationRepository.countConversations({ senderId, receiverId });
    const [conversations, totalConversations] = await Promise.all([conversationsPromise, totalPromise]);

    return { conversations, totalConversations };
  }

  async createConversation(payload: {
    senderId: string;
    receiverId: string;
    content: string;
    lastMessage: string;
  }): Promise<IConversation> {
    const conversation = await this.conversationRepository.create(payload);

    // emit message to frontend
    // if (toSocketId) {
    //   socket.to(toSocketId).emit('receiveMessage', { senderId, receiverId, content });
    // }

    return conversation;
  }
}

export default ConversationService;
