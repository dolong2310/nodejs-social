/*
 * Like Repository — compound unique (userId, postId), parallel to bookmarks.
 */

import { Injectable } from '@/decorators/injectable.decorator';
import { BaseRepository } from '@/modules/base/base.repository';
import { CreateLikeRequestDTO, DeleteLikeParamsDTO } from '@/modules/likes/dtos/likes.request.dto';
import { ILike, LikeSchema } from '@/modules/likes/likes.schema';
import { DatabaseService } from '@/providers/database/mongodb/database.service';
import { ObjectId } from 'mongodb';

export interface ILikeRepository {
  findOneAndUpdate({ userId, postId }: CreateLikeRequestDTO & { userId: string }): Promise<ILike | null>;
  findOneAndDelete({ userId, postId }: DeleteLikeParamsDTO & { userId: string }): Promise<ILike | null>;
}

@Injectable()
export class LikeRepository extends BaseRepository implements ILikeRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

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
