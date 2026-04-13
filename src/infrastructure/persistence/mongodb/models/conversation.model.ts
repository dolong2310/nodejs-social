import { IConversation } from '@/domain/entities/conversation.entity';
import { ObjectId } from 'mongodb';

export interface IConversationModel extends Omit<
  IConversation,
  'id' | 'createdBy' | 'avatarMediaId' | 'userIdLow' | 'userIdHigh'
> {
  _id?: ObjectId;
  createdBy: ObjectId;
  avatarMediaId?: ObjectId;
  userIdLow?: ObjectId;
  userIdHigh?: ObjectId;
}
