/*
 * Like Repository — compound unique (userId, postId), parallel to bookmarks.
 */

import { BaseRepository, CreateLikeRequestDTO, DeleteLikeParamsDTO, ILike, LikeSchema } from '@/modules';
import { ObjectId } from 'mongodb';

export interface ILikeRepository {
  findOneAndUpdate({ userId, postId }: CreateLikeRequestDTO & { userId: string }): Promise<ILike | null>;
  findOneAndDelete({ userId, postId }: DeleteLikeParamsDTO & { userId: string }): Promise<ILike | null>;
}

export class LikeRepository extends BaseRepository implements ILikeRepository {
  findOneAndUpdate({ userId, postId }: { userId: string; postId: string }): Promise<ILike | null> {
    return this.db.likes.findOneAndUpdate(
      { userId: new ObjectId(userId), postId: new ObjectId(postId) },
      { $setOnInsert: new LikeSchema({ userId: new ObjectId(userId), postId: new ObjectId(postId) }) },
      { upsert: true, returnDocument: 'after' }
    );
  }

  findOneAndDelete({ userId, postId }: { userId: string; postId: string }): Promise<ILike | null> {
    return this.db.likes.findOneAndDelete({ userId: new ObjectId(userId), postId: new ObjectId(postId) });
  }
}
