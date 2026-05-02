import { LoggerPort } from '@/modules/core/infrastructure/logger/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { BookmarkEntity } from '@/modules/bookmark/domain/entities/bookmark.entity';
import { BookmarkRepositoryPort } from '@/modules/bookmark/domain/repositories/bookmark.repository';
import { ICreateBookmarkInput, IDeleteBookmarkInput } from '@/modules/bookmark/domain/repositories/bookmark.repository.type';
import { BookmarkMapper } from '@/modules/bookmark/infrastructure/mappers/bookmark.mapper';
import { BookmarkModel } from '@/modules/bookmark/domain/repositories/bookmark.model';
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
      { userId, postId },
      { $setOnInsert: { userId, postId, createdAt: now, updatedAt: now } },
      { upsert: true, returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async deleteBookmark({ userId, postId }: IDeleteBookmarkInput): Promise<BookmarkEntity | null> {
    const result = await this.dbCollection.findOneAndDelete({ userId, postId });
    return result ? this.mapper.toDomain(result) : null;
  }
}
