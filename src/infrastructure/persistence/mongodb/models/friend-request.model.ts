import { IFriendRequest } from '@/domain/entities/friend-request.entity';
import { ObjectId } from 'mongodb';

export interface IFriendRequestModel extends Omit<IFriendRequest, 'id' | 'fromUserId' | 'toUserId'> {
  _id?: ObjectId;
  fromUserId: ObjectId;
  toUserId: ObjectId;
}
