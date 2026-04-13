import { IFriendship } from '@/domain/entities/friendship.entity';
import { ObjectId } from 'mongodb';

export interface IFriendshipModel extends Omit<IFriendship, 'id' | 'userIdLow' | 'userIdHigh'> {
  _id?: ObjectId;
  userIdLow: ObjectId;
  userIdHigh: ObjectId;
}
