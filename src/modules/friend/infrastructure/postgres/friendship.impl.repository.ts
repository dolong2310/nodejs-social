import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import { FriendshipEntity } from '@/modules/friend/domain/entities/friendship.entity';
import { FriendshipRepositoryPort } from '@/modules/friend/domain/repositories/friendship.repository';
import {
  ICountFriendshipsWithUserAmongOthersInput,
  IListFriendIdsByCursorInput
} from '@/modules/friend/domain/repositories/friendship.repository.type';
import { FriendshipMapper } from '@/modules/friend/infrastructure/postgres/friendship.mapper';
import { FriendshipModel } from '@/modules/friend/infrastructure/postgres/friendship.model';
import type { Pool } from 'pg';

const UNIQUE_VIOLATION = '23505';

export function normalizeFriendshipPair(a: string, b: string): { userIdLow: string; userIdHigh: string } {
  const cmp = a.localeCompare(b);
  if (cmp === 0) {
    throw new Error('Friendship pair requires two distinct user ids');
  }
  return cmp < 0 ? { userIdLow: a, userIdHigh: b } : { userIdLow: b, userIdHigh: a };
}

export class FriendshipRepository
  extends PostgresRepositoryBase<FriendshipEntity, FriendshipModel>
  implements FriendshipRepositoryPort
{
  protected tableName = 'friendships';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: FriendshipMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async findFriendIdsByUserId(userId: string): Promise<string[]> {
    const result = await this.query<{ friend_id: string }>(
      `
        SELECT friend_id
        FROM (
          SELECT user_id_high AS friend_id FROM friendships WHERE user_id_low = $1
          UNION
          SELECT user_id_low AS friend_id FROM friendships WHERE user_id_high = $1
        ) friends
      `,
      [userId]
    );
    return result.rows.map((record) => record.friend_id);
  }

  async findFriendshipPair(userIdA: string, userIdB: string): Promise<FriendshipEntity | null> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(userIdA, userIdB);
    const result = await this.query<FriendshipModel>(
      `SELECT * FROM friendships WHERE user_id_low = $1 AND user_id_high = $2 LIMIT 1`,
      [userIdLow, userIdHigh]
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async listFriendIdsByCursor({ userId, limit, cursor }: IListFriendIdsByCursorInput): Promise<string[]> {
    const result = await this.query<{ friend_id: string }>(
      `
        SELECT friend_id
        FROM (
          SELECT user_id_high AS friend_id FROM friendships WHERE user_id_low = $1
          UNION
          SELECT user_id_low AS friend_id FROM friendships WHERE user_id_high = $1
        ) friends
        WHERE ($2::text IS NULL OR friend_id > $2)
        ORDER BY friend_id ASC
        LIMIT $3
      `,
      [userId, cursor ?? null, limit]
    );
    return result.rows.map((record) => record.friend_id);
  }

  async createFriendship(userIdA: string, userIdB: string): Promise<FriendshipEntity | null> {
    try {
      const { userIdLow, userIdHigh } = normalizeFriendshipPair(userIdA, userIdB);
      const entity = FriendshipEntity.create({ userIdLow, userIdHigh });
      const record = this.mapper.toPersistence(entity);
      const result = await this.query<FriendshipModel>(
        `
          INSERT INTO friendships (id, user_id_low, user_id_high, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `,
        [record.id, record.user_id_low, record.user_id_high, record.created_at, record.updated_at]
      );
      return this.mapper.toDomain(result.rows[0] ?? record);
    } catch (error) {
      if ((error as { code?: string })?.code === UNIQUE_VIOLATION) {
        return null;
      }
      throw error;
    }
  }

  async deleteFriendship(userIdA: string, userIdB: string): Promise<number> {
    const { userIdLow, userIdHigh } = normalizeFriendshipPair(userIdA, userIdB);
    const result = await this.query(`DELETE FROM friendships WHERE user_id_low = $1 AND user_id_high = $2`, [
      userIdLow,
      userIdHigh
    ]);
    return result.rowCount ?? 0;
  }

  async countFriendshipsWithUserAmongOthers({
    userId,
    otherUserIds
  }: ICountFriendshipsWithUserAmongOthersInput): Promise<number> {
    if (otherUserIds.length === 0) return 0;
    const result = await this.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM friendships
        WHERE (user_id_low = $1 AND user_id_high = ANY($2::text[]))
           OR (user_id_high = $1 AND user_id_low = ANY($2::text[]))
      `,
      [userId, otherUserIds]
    );
    return Number(result.rows[0]?.count ?? 0);
  }
}
