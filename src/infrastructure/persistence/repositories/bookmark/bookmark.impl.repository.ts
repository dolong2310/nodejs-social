import { LoggerPort } from '@/application/ports/logger.port';
import { BookmarkEntity } from '@/domain/entities/bookmark/bookmark.entity';
import { BookmarkRepositoryPort } from '@/domain/repositories/bookmark/bookmark.repository';
import { ICreateBookmarkInput, IDeleteBookmarkInput } from '@/domain/repositories/bookmark/bookmark.repository.type';
import { MongoRepositoryBase } from '@/infrastructure/persistence/repositories/base/base.mongo.repository';
import { BookmarkMapper } from '@/infrastructure/persistence/repositories/bookmark/bookmark.mapper';
import { BookmarkModel } from '@/infrastructure/persistence/repositories/bookmark/bookmark.model';
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
    const result = await this.dbCollection.findOneAndUpdate(
      { userId, postId },
      { $setOnInsert: { userId, postId } },
      { upsert: true, returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async deleteBookmark({ userId, postId }: IDeleteBookmarkInput): Promise<BookmarkEntity | null> {
    const result = await this.dbCollection.findOneAndDelete({ userId, postId });
    return result ? this.mapper.toDomain(result) : null;
  }
}
