import { IPost } from '@/domain/entities/post.entity';
import { ObjectId } from 'mongodb';

export interface IPostModel extends Omit<IPost, 'id' | 'userId' | 'parentId' | 'hashtags' | 'mentions'> {
  _id?: ObjectId;
  userId: ObjectId;
  parentId: ObjectId | null;
  hashtags: ObjectId[];
  mentions: ObjectId[];
}
