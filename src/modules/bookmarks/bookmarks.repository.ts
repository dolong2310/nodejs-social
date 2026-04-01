/*
 * Bookmark Repository
 * This file contains the BookmarkRepository class which implements IBookmarkRepository interface.
 * It provides methods to interact with the bookmark data in the database.
 */

import { Injectable } from '@/decorators/injectable.decorator';
import { BaseRepository } from '@/modules/base/base.repository';
import { BookmarkSchema, IBookmark } from '@/modules/bookmarks/bookmarks.schema';
import { CreateBookmarkRequestDTO, DeleteBookmarkParamsDTO } from '@/modules/bookmarks/dtos/bookmarks.request.dto';
import { DatabaseService } from '@/providers/database/mongodb/database.service';
import { ObjectId } from 'mongodb';

export interface IBookmarkRepository {
  findOneAndUpdate({ userId, postId }: CreateBookmarkRequestDTO & { userId: string }): Promise<IBookmark | null>;
  findOneAndDelete({ userId, postId }: DeleteBookmarkParamsDTO & { userId: string }): Promise<IBookmark | null>;
}

@Injectable()
export class BookmarkRepository extends BaseRepository implements IBookmarkRepository {
  constructor(db: DatabaseService) {
    super(db);
  }

  findOneAndUpdate({ userId, postId }: { userId: string; postId: string }): Promise<IBookmark | null> {
    return this.db.bookmarks.findOneAndUpdate(
      { userId: new ObjectId(userId), postId: new ObjectId(postId) },
      { $setOnInsert: new BookmarkSchema({ userId: new ObjectId(userId), postId: new ObjectId(postId) }) },
      { upsert: true, returnDocument: 'after' }
    );
  }

  findOneAndDelete({ userId, postId }: { userId: string; postId: string }): Promise<IBookmark | null> {
    return this.db.bookmarks.findOneAndDelete({ userId: new ObjectId(userId), postId: new ObjectId(postId) });
  }
}
