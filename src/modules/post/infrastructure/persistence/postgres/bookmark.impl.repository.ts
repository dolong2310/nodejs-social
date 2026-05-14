import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import { BookmarkEntity } from '@/modules/post/domain/entities/bookmark.entity';
import { BookmarkRepositoryPort } from '@/modules/post/domain/repositories/bookmark.repository';
import { CreateBookmarkInput, DeleteBookmarkInput } from '@/modules/post/domain/repositories/bookmark.repository.type';
import { BookmarkMapper } from '@/modules/post/infrastructure/persistence/postgres/bookmark.mapper';
import { BookmarkModel } from '@/modules/post/infrastructure/persistence/postgres/bookmark.model';
import type { Pool } from 'pg';

export class BookmarkRepository
  extends PostgresRepositoryBase<BookmarkEntity, BookmarkModel>
  implements BookmarkRepositoryPort
{
  protected tableName = 'bookmarks';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: BookmarkMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async createBookmark(data: CreateBookmarkInput): Promise<BookmarkEntity | null> {
    const entity = BookmarkEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    await this.query(
      `
        INSERT INTO bookmarks (id, user_id, post_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, post_id) DO NOTHING
      `,
      [record.id, record.user_id, record.post_id, record.created_at, record.updated_at]
    );

    const result = await this.query<BookmarkModel>(
      `SELECT * FROM bookmarks WHERE user_id = $1 AND post_id = $2 LIMIT 1`,
      [record.user_id, record.post_id]
    );
    const [createdOrExisting] = result.rows;
    return createdOrExisting ? this.mapper.toDomain(createdOrExisting) : null;
  }

  async deleteBookmark(data: DeleteBookmarkInput): Promise<BookmarkEntity | null> {
    const result = await this.query<BookmarkModel>(
      `DELETE FROM bookmarks WHERE user_id = $1 AND post_id = $2 RETURNING *`,
      [data.userId, data.postId]
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }
}
