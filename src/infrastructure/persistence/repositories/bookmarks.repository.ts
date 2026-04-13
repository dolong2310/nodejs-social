import { IBookmark } from '@/domain/entities/bookmark.entity';
import { ICreateBookmarkInput, IDeleteBookmarkInput } from '@/domain/repositories/bookmark/bookmark.interface';
import { IBookmarkRepository } from '@/domain/repositories/bookmark/bookmark.repository';
import { BookmarkMapper } from '@/infrastructure/persistence/mapper/bookmark.mapper';
import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';
import { BaseRepository } from '@/infrastructure/persistence/repositories/base.repository';

export class BookmarkRepository extends BaseRepository implements IBookmarkRepository {
  constructor(
    db: DatabaseService,
    private readonly bookmarkMapper: BookmarkMapper
  ) {
    super(db);
  }

  async createBookmark(data: ICreateBookmarkInput): Promise<IBookmark | null> {
    const record = this.bookmarkMapper.toPersistence(data);
    const result = await this.db.bookmarks.findOneAndUpdate(
      { userId: record.userId, postId: record.postId },
      { $setOnInsert: { userId: record.userId, postId: record.postId } },
      { upsert: true, returnDocument: 'after' }
    );
    return result ? this.bookmarkMapper.toDomain(result) : null;
  }

  async deleteBookmark(data: IDeleteBookmarkInput): Promise<IBookmark | null> {
    const record = this.bookmarkMapper.toPersistence(data);
    const result = await this.db.bookmarks.findOneAndDelete({ userId: record.userId, postId: record.postId });
    return result ? this.bookmarkMapper.toDomain(result) : null;
  }
}
