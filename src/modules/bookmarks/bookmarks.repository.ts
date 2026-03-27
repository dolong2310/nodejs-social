/*
 * Bookmark Repository
 * This file contains the BookmarkRepository class which implements IBookmarkRepository interface.
 * It provides methods to interact with the bookmark data in the database.
 */

import {
  BaseRepository,
  BookmarkSchema,
  CreateBookmarkRequestDTO,
  DeleteBookmarkParamsDTO,
  IBookmark
} from '@/modules';
import { ObjectId } from 'mongodb';

export interface IBookmarkRepository {
  findOneAndUpdate({ userId, postId }: CreateBookmarkRequestDTO & { userId: string }): Promise<IBookmark | null>;
  findOneAndDelete({ userId, postId }: DeleteBookmarkParamsDTO & { userId: string }): Promise<IBookmark | null>;
}

export class BookmarkRepository extends BaseRepository implements IBookmarkRepository {
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
