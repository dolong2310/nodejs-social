import { IChatMessage } from '@/domain/entities/chat-message.entity';
import { ObjectId } from 'mongodb';

export interface IChatMessageModel extends Omit<IChatMessage, 'id' | 'conversationId' | 'senderId'> {
  _id?: ObjectId;
  conversationId: ObjectId;
  senderId: ObjectId;
}
