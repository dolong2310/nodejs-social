import { ILike } from '@/domain/entities/like.entity';
import { ObjectId } from 'mongodb';

export interface ILikeModel extends Omit<ILike, 'id' | 'userId' | 'postId'> {
  _id?: ObjectId;
  userId: ObjectId;
  postId: ObjectId;
}
