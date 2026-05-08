import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import { BlockEntity } from '@/modules/relationship/domain/entities/block.entity';
import { BlockRepositoryPort } from '@/modules/relationship/domain/repositories/block.repository';
import { BlockMapper } from '@/modules/relationship/infrastructure/persistence/postgres/block.mapper';
import { BlockModel } from '@/modules/relationship/infrastructure/persistence/postgres/block.model';
import type { Pool } from 'pg';

const UNIQUE_VIOLATION = '23505';

export class BlockRepository extends PostgresRepositoryBase<BlockEntity, BlockModel> implements BlockRepositoryPort {
  protected tableName = 'blocks';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: BlockMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async isBlockedEitherWay(userIdA: string, userIdB: string): Promise<boolean> {
    const result = await this.query<{ exists: boolean }>(
      `
        SELECT EXISTS (
          SELECT 1
          FROM blocks
          WHERE (blocker_id = $1 AND blocked_id = $2)
             OR (blocker_id = $2 AND blocked_id = $1)
        ) AS exists
      `,
      [userIdA, userIdB]
    );
    return result.rows[0]?.exists ?? false;
  }

  async listBlockedUserIdsForBlocker(blockerId: string): Promise<string[]> {
    const result = await this.query<{ blocked_id: string }>(
      `SELECT DISTINCT blocked_id FROM blocks WHERE blocker_id = $1`,
      [blockerId]
    );
    return result.rows.map((record) => record.blocked_id);
  }

  async listUserIdsBlockedInEitherDirection(userId: string): Promise<string[]> {
    const result = await this.query<{ user_id: string }>(
      `
        SELECT DISTINCT user_id
        FROM (
          SELECT blocked_id AS user_id FROM blocks WHERE blocker_id = $1
          UNION
          SELECT blocker_id AS user_id FROM blocks WHERE blocked_id = $1
        ) blocked_users
      `,
      [userId]
    );
    return result.rows.map((record) => record.user_id);
  }

  async createBlock(blockerId: string, blockedId: string): Promise<void> {
    const entity = BlockEntity.create({ blockerId, blockedId });
    const record = this.mapper.toPersistence(entity);

    try {
      await this.query(
        `
          INSERT INTO blocks (id, blocker_id, blocked_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
        `,
        [record.id, record.blocker_id, record.blocked_id, record.created_at, record.updated_at]
      );
    } catch (error) {
      if ((error as { code?: string })?.code === UNIQUE_VIOLATION) {
        throw new Error('Block already exists', { cause: error });
      }
      throw error;
    }
  }

  async deleteBlock(blockerId: string, blockedId: string): Promise<number> {
    const result = await this.query(`DELETE FROM blocks WHERE blocker_id = $1 AND blocked_id = $2`, [
      blockerId,
      blockedId
    ]);
    return result.rowCount ?? 0;
  }
}
