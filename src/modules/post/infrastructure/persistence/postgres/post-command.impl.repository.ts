import { PostCommandRepositoryPort } from '@/modules/post/domain/repositories/post.command.repository';
import {
  IIncreasePostsViewsInput,
  IIncreasePostViewsInput,
  IIncreasePostViewsOutput,
  IPublishPostInput,
  IPublishPostOutput
} from '@/modules/post/domain/repositories/post.command.type';
import { PostEntity } from '@/modules/post/domain/entities/post.entity';
import { PostMapper } from '@/modules/post/infrastructure/persistence/postgres/post.mapper';
import { PostModel } from '@/modules/post/infrastructure/persistence/postgres/post.model';
import type { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

type Queryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;

export class PostCommandRepository implements PostCommandRepositoryPort {
  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: PostMapper
  ) {}

  async publishPost({
    hashtagIds,
    mentionedUserIds,
    media,
    ...postInput
  }: IPublishPostInput): Promise<IPublishPostOutput> {
    const entity = PostEntity.create(postInput);
    const record = this.mapper.toPersistence(entity);
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await this.queryWith<PostModel>(
        client,
        `
          INSERT INTO posts (
            id,
            user_id,
            type,
            audience,
            allow_stranger_comments,
            content,
            parent_id,
            created_at,
            updated_at
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `,
        [
          record.id,
          record.user_id,
          record.type,
          record.audience,
          record.allow_stranger_comments,
          record.content,
          record.parent_id,
          record.created_at,
          record.updated_at
        ]
      );
      await this.insertPostCounters(client, record.id);
      await this.insertPostHashtags(client, record.id, hashtagIds);
      await this.insertPostMentions(client, record.id, mentionedUserIds);
      await this.insertPostMedia(client, record.id, media);
      await client.query('COMMIT');
      return entity.toObject<IPublishPostOutput>();
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async increasePostViews({ postId, userId }: IIncreasePostViewsInput): Promise<IIncreasePostViewsOutput | null> {
    const column = userId ? 'user_views' : 'guest_views';
    const result = await this.pool.query<{
      user_views: number;
      guest_views: number;
      updated_at: Date;
    }>(
      `
        UPDATE post_counters
        SET ${column} = ${column} + 1, updated_at = NOW()
        WHERE post_id = $1
        RETURNING user_views, guest_views, updated_at
      `,
      [postId]
    );
    const [record] = result.rows;
    return record
      ? {
          userViews: record.user_views,
          guestViews: record.guest_views,
          updatedAt: record.updated_at
        }
      : null;
  }

  async increasePostsViews({ ids, isAuthenticatedViewer }: IIncreasePostsViewsInput): Promise<number> {
    if (ids.length === 0) return 0;
    const column = isAuthenticatedViewer ? 'user_views' : 'guest_views';
    const result = await this.pool.query(
      `
        UPDATE post_counters
        SET ${column} = ${column} + 1, updated_at = NOW()
        WHERE post_id = ANY($1::text[])
      `,
      [[...new Set(ids)]]
    );
    return result.rowCount ?? 0;
  }

  private async insertPostCounters(client: PoolClient, postId: string): Promise<void> {
    await this.queryWith(client, `INSERT INTO post_counters (post_id) VALUES ($1)`, [postId]);
  }

  private async insertPostHashtags(client: PoolClient, postId: string, hashtagIds: string[]): Promise<void> {
    const ids = this.uniqueOrdered(hashtagIds);
    if (ids.length === 0) return;
    await this.queryWith(
      client,
      `
        INSERT INTO post_hashtags (post_id, hashtag_id, position)
        SELECT $1, input.id, input.ord - 1
        FROM unnest($2::text[]) WITH ORDINALITY AS input(id, ord)
        ON CONFLICT DO NOTHING
      `,
      [postId, ids]
    );
  }

  private async insertPostMentions(client: PoolClient, postId: string, mentionedUserIds: string[]): Promise<void> {
    const ids = this.uniqueOrdered(mentionedUserIds);
    if (ids.length === 0) return;
    await this.queryWith(
      client,
      `
        INSERT INTO post_mentions (post_id, mentioned_user_id, position)
        SELECT $1, input.id, input.ord - 1
        FROM unnest($2::text[]) WITH ORDINALITY AS input(id, ord)
        ON CONFLICT DO NOTHING
      `,
      [postId, ids]
    );
  }

  private async insertPostMedia(
    client: PoolClient,
    postId: string,
    mediaItems: IPublishPostInput['media']
  ): Promise<void> {
    if (mediaItems.length === 0) return;

    const values: unknown[] = [];
    const rows = mediaItems.map((media, index) => {
      const raw = media.raw();
      values.push(`${postId}:media:${index}`, postId, raw.url, raw.type, index);
      const offset = index * 5;
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5})`;
    });

    await this.queryWith(
      client,
      `
        INSERT INTO post_media (id, post_id, url, type, position)
        VALUES ${rows.join(', ')}
      `,
      values
    );
  }

  private uniqueOrdered(ids: string[]): string[] {
    return [...new Set(ids)];
  }

  private queryWith<T extends QueryResultRow = QueryResultRow>(
    client: Queryable,
    sql: string,
    params: readonly unknown[] = []
  ): Promise<QueryResult<T>> {
    return client.query<T>(sql, [...params]);
  }
}
