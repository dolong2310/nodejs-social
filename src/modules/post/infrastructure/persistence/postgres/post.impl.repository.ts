import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import { PostEntity } from '@/modules/post/domain/entities/post.entity';
import { PostRepositoryPort } from '@/modules/post/domain/repositories/post.repository';
import {
  ICreatePostInput,
  IUpdatePostAudienceAndStrangerCommentsInput
} from '@/modules/post/domain/repositories/post.repository.type';
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

  async createPost(data: ICreatePostInput): Promise<PostEntity> {
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

  async updatePostAudienceAndStrangerComments(
    data: IUpdatePostAudienceAndStrangerCommentsInput
  ): Promise<PostEntity | null> {
    const { postId, ownerUserId, audience, allowStrangerComments } = data;
    const result = await this.query<PostModel>(
      `
        UPDATE posts
        SET audience = $3, allow_stranger_comments = $4, updated_at = NOW()
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `,
      [postId, ownerUserId, audience, allowStrangerComments]
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }
}
