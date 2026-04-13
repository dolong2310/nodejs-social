import { IBookmark } from '@/domain/entities/bookmark.entity';
import { ObjectId } from 'mongodb';

export interface IBookmarkModel extends Omit<IBookmark, 'id' | 'userId' | 'postId'> {
  _id?: ObjectId;
  userId: ObjectId;
  postId: ObjectId;
}
