import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import { LikeEntity } from '@/modules/post/domain/entities/like.entity';
import { LikeRepositoryPort } from '@/modules/post/domain/repositories/like.repository';
import { CreateLikeInput, DeleteLikeInput } from '@/modules/post/domain/repositories/like.repository.type';
import { LikeMapper } from '@/modules/post/infrastructure/persistence/postgres/like.mapper';
import { LikeModel } from '@/modules/post/infrastructure/persistence/postgres/like.model';
import type { Pool } from 'pg';

export class LikeRepository extends PostgresRepositoryBase<LikeEntity, LikeModel> implements LikeRepositoryPort {
  protected tableName = 'likes';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: LikeMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async createLike(data: CreateLikeInput): Promise<LikeEntity | null> {
    const entity = LikeEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    await this.query(
      `
        INSERT INTO likes (id, user_id, post_id, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (user_id, post_id) DO NOTHING
      `,
      [record.id, record.user_id, record.post_id, record.created_at, record.updated_at]
    );

    const result = await this.query<LikeModel>(`SELECT * FROM likes WHERE user_id = $1 AND post_id = $2 LIMIT 1`, [
      record.user_id,
      record.post_id
    ]);
    const [createdOrExisting] = result.rows;
    return createdOrExisting ? this.mapper.toDomain(createdOrExisting) : null;
  }

  async deleteLike(data: DeleteLikeInput): Promise<LikeEntity | null> {
    const result = await this.query<LikeModel>(`DELETE FROM likes WHERE user_id = $1 AND post_id = $2 RETURNING *`, [
      data.userId,
      data.postId
    ]);
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }
}
