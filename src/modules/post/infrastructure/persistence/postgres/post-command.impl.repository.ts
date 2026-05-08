import { PostCommandRepositoryPort } from '@/modules/post/domain/repositories/post.command.repository';
import {
  IIncreasePostsViewsInput,
  IIncreasePostViewsInput,
  IIncreasePostViewsOutput
} from '@/modules/post/domain/repositories/post.command.type';
import type { Pool } from 'pg';

export class PostCommandRepository implements PostCommandRepositoryPort {
  constructor(protected readonly pool: Pool) {}

  async increasePostViews({ postId, userId }: IIncreasePostViewsInput): Promise<IIncreasePostViewsOutput | null> {
    const column = userId ? 'user_views' : 'guest_views';
    const result = await this.pool.query<{
      user_views: number;
      guest_views: number;
      updated_at: Date;
    }>(
      `
        UPDATE posts
        SET ${column} = ${column} + 1, updated_at = NOW()
        WHERE id = $1
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
        UPDATE posts
        SET ${column} = ${column} + 1, updated_at = NOW()
        WHERE id = ANY($1::text[])
      `,
      [[...new Set(ids)]]
    );
    return result.rowCount ?? 0;
  }
}
