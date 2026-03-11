import BookmarkSchema from '@/models/schemas/bookmark.schema';
import databaseService from '@/services/database.service';
import { ObjectId } from 'mongodb';

class BookmarksService {
  constructor() {}

  bookmarkPost({ userId, postId }: { userId: string; postId: string }) {
    return databaseService.bookmarks.findOneAndUpdate(
      { userId: new ObjectId(userId), postId: new ObjectId(postId) },
      { $setOnInsert: new BookmarkSchema({ userId: new ObjectId(userId), postId: new ObjectId(postId) }) },
      { upsert: true, returnDocument: 'after' }
    );
  }

  unbookmarkPost({ userId, postId }: { userId: string; postId: string }) {
    return databaseService.bookmarks.findOneAndDelete({ userId: new ObjectId(userId), postId: new ObjectId(postId) });
  }
}

export default new BookmarksService();
