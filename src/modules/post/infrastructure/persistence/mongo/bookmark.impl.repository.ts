import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { BookmarkEntity } from '@/modules/post/domain/entities/bookmark.entity';
import { BookmarkRepositoryPort } from '@/modules/post/domain/repositories/bookmark.repository';
import {
  ICreateBookmarkInput,
  IDeleteBookmarkInput
} from '@/modules/post/domain/repositories/bookmark.repository.type';
import { BookmarkMapper } from '@/modules/post/infrastructure/persistence/mongo/bookmark.mapper';
import { BookmarkModel } from '@/modules/post/infrastructure/persistence/mongo/bookmark.model';
import { Db, MongoClient } from 'mongodb';

export class BookmarkRepository
  extends MongoRepositoryBase<BookmarkEntity, BookmarkModel>
  implements BookmarkRepositoryPort
{
  protected collectionName = 'bookmarks';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: BookmarkMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async createBookmark({ userId, postId }: ICreateBookmarkInput): Promise<BookmarkEntity | null> {
    const now = new Date();
    const result = await this.dbCollection.findOneAndUpdate(
      { user_id: userId, post_id: postId },
      { $setOnInsert: { user_id: userId, post_id: postId, created_at: now, updated_at: now } },
      { upsert: true, returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async deleteBookmark({ userId, postId }: IDeleteBookmarkInput): Promise<BookmarkEntity | null> {
    const result = await this.dbCollection.findOneAndDelete({ user_id: userId, post_id: postId });
    return result ? this.mapper.toDomain(result) : null;
  }
}
