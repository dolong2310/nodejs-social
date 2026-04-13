import { IConversationMember } from '@/domain/entities/conversation-member.entity';
import { ObjectId } from 'mongodb';

export interface IConversationMemberModel extends Omit<
  IConversationMember,
  'id' | 'conversationId' | 'userId' | 'lastReadMessageId'
> {
  _id?: ObjectId;
  conversationId: ObjectId;
  userId: ObjectId;
  lastReadMessageId?: ObjectId;
}
