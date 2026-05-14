import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import { HashtagEntity } from '@/modules/post/domain/entities/hashtag.entity';
import { HashtagRepositoryPort } from '@/modules/post/domain/repositories/hashtag.repository';
import {
  CreateHashtagInput,
  ListHashtagsInput,
  UpdateHashtagInput
} from '@/modules/post/domain/repositories/hashtag.repository.type';
import { HashtagMapper } from '@/modules/post/infrastructure/persistence/postgres/hashtag.mapper';
import { HashtagModel } from '@/modules/post/infrastructure/persistence/postgres/hashtag.model';
import type { Pool } from 'pg';

export class HashtagRepository
  extends PostgresRepositoryBase<HashtagEntity, HashtagModel>
  implements HashtagRepositoryPort
{
  protected tableName = 'hashtags';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: HashtagMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async createHashtag(data: CreateHashtagInput): Promise<HashtagEntity> {
    const entity = HashtagEntity.create(data);
    return this.insert(entity);
  }

  async insertBulk(hashtags: string[]): Promise<HashtagEntity[]> {
    if (hashtags.length === 0) return [];

    const uniqueNames = [...new Set(hashtags)];
    const entities = uniqueNames.map((name) => HashtagEntity.create({ name }));
    const records = entities.map((entity) => this.mapper.toPersistence(entity));

    const values: unknown[] = [];
    const tuples = records.map((record, index) => {
      const start = index * 4;
      values.push(record.id, record.name, record.created_at, record.updated_at);
      return `($${start + 1}, $${start + 2}, $${start + 3}, $${start + 4})`;
    });

    await this.query(
      `
        INSERT INTO hashtags (id, name, created_at, updated_at)
        VALUES ${tuples.join(', ')}
        ON CONFLICT (name) DO NOTHING
      `,
      values
    );

    const result = await this.query<HashtagModel>(`SELECT * FROM hashtags WHERE name = ANY($1::text[])`, [uniqueNames]);
    return result.rows.map((record) => this.mapper.toDomain(record));
  }

  async findHashtagById(id: string): Promise<HashtagEntity | null> {
    return this.findById(id);
  }

  async findHashtagByName(name: string): Promise<HashtagEntity | null> {
    const result = await this.query<HashtagModel>(`SELECT * FROM hashtags WHERE name = $1 LIMIT 1`, [name]);
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async findHashtags({ limit, skip = 0 }: ListHashtagsInput): Promise<HashtagEntity[]> {
    const result = await this.query<HashtagModel>(`SELECT * FROM hashtags ORDER BY name ASC OFFSET $1 LIMIT $2`, [
      skip,
      limit
    ]);
    return result.rows.map((record) => this.mapper.toDomain(record));
  }

  async countHashtags(): Promise<number> {
    return this.count();
  }

  async updateHashtag(id: string, data: UpdateHashtagInput): Promise<HashtagEntity | null> {
    if (data.name === undefined) return this.findHashtagById(id);

    const result = await this.query<HashtagModel>(
      `
        UPDATE hashtags
        SET name = $2, updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `,
      [id, data.name]
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async deleteHashtag(id: string): Promise<HashtagEntity | null> {
    const result = await this.query<HashtagModel>(`DELETE FROM hashtags WHERE id = $1 RETURNING *`, [id]);
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }
}
