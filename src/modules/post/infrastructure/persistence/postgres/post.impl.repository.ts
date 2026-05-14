import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import { PostEntity } from '@/modules/post/domain/entities/post.entity';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import { CreatePostInput, UpdatePostInput } from '@/modules/post/domain/repositories/post.repository.type';
import { PostMapper } from '@/modules/post/infrastructure/persistence/postgres/post.mapper';
import { PostModel } from '@/modules/post/infrastructure/persistence/postgres/post.model';
import type { Pool } from 'pg';

export class PostRepository extends PostgresRepositoryBase<PostEntity, PostModel> implements PostRepositoryPort {
  protected tableName = 'posts';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: PostMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async findPostById(id: string): Promise<PostEntity | null> {
    return this.findById(id);
  }

  async createPost(data: CreatePostInput): Promise<PostEntity> {
    const entity = PostEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    const result = await this.query<PostModel>(
      `
        INSERT INTO posts (
          id,
          user_id,
          type,
          audience,
          allow_stranger_comments,
          content,
          parent_id,
          hashtags,
          mentions,
          media,
          guest_views,
          user_views,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10::jsonb, $11, $12, $13, $14)
        RETURNING *
      `,
      [
        record.id,
        record.user_id,
        record.type,
        record.audience,
        record.allow_stranger_comments,
        record.content,
        record.parent_id,
        record.hashtags,
        record.mentions,
        JSON.stringify(record.media),
        record.guest_views,
        record.user_views,
        record.created_at,
        record.updated_at
      ]
    );
    return this.mapper.toDomain(result.rows[0] ?? record);
  }

  async updatePost(data: UpdatePostInput): Promise<PostEntity | null> {
    const { postId, ownerUserId, audience, allowStrangerComments, content, hashtags, mentions, media } = data;
    const setParts: string[] = [];
    const values: unknown[] = [postId, ownerUserId];
    let nextParam = 3;

    const addSet = (column: string, value: unknown, cast = '') => {
      setParts.push(`${column} = $${nextParam}${cast}`);
      values.push(value);
      nextParam += 1;
    };

    if (audience !== undefined) addSet('audience', audience);
    if (allowStrangerComments !== undefined) addSet('allow_stranger_comments', allowStrangerComments);
    if (content !== undefined) addSet('content', content);
    if (hashtags !== undefined) addSet('hashtags', hashtags);
    if (mentions !== undefined) addSet('mentions', mentions);
    if (media !== undefined) addSet('media', JSON.stringify(media.map((item) => item.raw())), '::jsonb');

    if (setParts.length === 0) {
      const result = await this.query<PostModel>('SELECT * FROM posts WHERE id = $1 AND user_id = $2 LIMIT 1', [
        postId,
        ownerUserId
      ]);
      const [record] = result.rows;
      return record ? this.mapper.toDomain(record) : null;
    }

    setParts.push('updated_at = NOW()');
    const result = await this.query<PostModel>(
      `
        UPDATE posts
        SET ${setParts.join(', ')}
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `,
      values
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }
}
