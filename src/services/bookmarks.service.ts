import BookmarkSchema from '@/models/schemas/bookmark.schema';
import { DatabaseSingleton } from '@/services/database.singleton';
import { ObjectId } from 'mongodb';

class BookmarksService {
  constructor() {}

  private get db() {
    return DatabaseSingleton.get();
  }

  bookmarkPost({ userId, postId }: { userId: string; postId: string }) {
    return this.db.bookmarks.findOneAndUpdate(
      { userId: new ObjectId(userId), postId: new ObjectId(postId) },
      { $setOnInsert: new BookmarkSchema({ userId: new ObjectId(userId), postId: new ObjectId(postId) }) },
      { upsert: true, returnDocument: 'after' }
    );
  }

  unbookmarkPost({ userId, postId }: { userId: string; postId: string }) {
    return this.db.bookmarks.findOneAndDelete({ userId: new ObjectId(userId), postId: new ObjectId(postId) });
  }
}

export default new BookmarksService();
