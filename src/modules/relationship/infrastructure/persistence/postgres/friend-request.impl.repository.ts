import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import { FriendRequestEntity } from '@/modules/relationship/domain/entities/friend-request.entity';
import { FriendRequestRepositoryPort } from '@/modules/relationship/domain/repositories/friend-request.repository';
import {
  CountOutgoingRequestsCreatedOnUtcDayInput,
  CreatePendingRequestInput,
  DeleteAllRequestsBetweenUsersInput,
  DeletePendingRequestInput,
  FindPendingRequestByUserPairInput,
  ListIncomingForUserInput,
  ListOutgoingForUserInput
} from '@/modules/relationship/domain/repositories/friend-request.repository.type';
import { FriendRequestMapper } from '@/modules/relationship/infrastructure/persistence/postgres/friend-request.mapper';
import { FriendRequestModel } from '@/modules/relationship/infrastructure/persistence/postgres/friend-request.model';
import type { Pool } from 'pg';

const UNIQUE_VIOLATION = '23505';

export class FriendRequestRepository
  extends PostgresRepositoryBase<FriendRequestEntity, FriendRequestModel>
  implements FriendRequestRepositoryPort
{
  protected tableName = 'friend_requests';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: FriendRequestMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async findPendingRequestByUserPair({
    fromUserId,
    toUserId
  }: FindPendingRequestByUserPairInput): Promise<FriendRequestEntity | null> {
    const result = await this.query<FriendRequestModel>(
      `SELECT * FROM friend_requests WHERE from_user_id = $1 AND to_user_id = $2 LIMIT 1`,
      [fromUserId, toUserId]
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async listIncomingForUser({ toUserId, limit, cursor }: ListIncomingForUserInput): Promise<FriendRequestEntity[]> {
    const params: unknown[] = [toUserId];
    let cursorClause = '';
    if (cursor) {
      const { createdAt, id } = cursor.raw();
      params.push(createdAt, id);
      cursorClause = `AND (created_at < $2 OR (created_at = $2 AND id < $3))`;
    }
    params.push(limit);
    const limitPlaceholder = `$${params.length}`;

    const result = await this.query<FriendRequestModel>(
      `
        SELECT *
        FROM friend_requests
        WHERE to_user_id = $1
          ${cursorClause}
        ORDER BY created_at DESC, id DESC
        LIMIT ${limitPlaceholder}
      `,
      params
    );
    return result.rows.map((record) => this.mapper.toDomain(record));
  }

  async listOutgoingForUser({ fromUserId, limit, cursor }: ListOutgoingForUserInput): Promise<FriendRequestEntity[]> {
    const params: unknown[] = [fromUserId];
    let cursorClause = '';
    if (cursor) {
      const { createdAt, id } = cursor.raw();
      params.push(createdAt, id);
      cursorClause = `AND (created_at < $2 OR (created_at = $2 AND id < $3))`;
    }
    params.push(limit);
    const limitPlaceholder = `$${params.length}`;

    const result = await this.query<FriendRequestModel>(
      `
        SELECT *
        FROM friend_requests
        WHERE from_user_id = $1
          ${cursorClause}
        ORDER BY created_at DESC, id DESC
        LIMIT ${limitPlaceholder}
      `,
      params
    );
    return result.rows.map((record) => this.mapper.toDomain(record));
  }

  async createPendingRequest({ fromUserId, toUserId }: CreatePendingRequestInput): Promise<FriendRequestEntity> {
    try {
      const entity = FriendRequestEntity.create({ fromUserId, toUserId });
      const record = this.mapper.toPersistence(entity);
      const result = await this.query<FriendRequestModel>(
        `
          INSERT INTO friend_requests (id, from_user_id, to_user_id, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
          RETURNING *
        `,
        [record.id, record.from_user_id, record.to_user_id, record.created_at, record.updated_at]
      );
      return this.mapper.toDomain(result.rows[0] ?? record);
    } catch (error) {
      if ((error as { code?: string })?.code === UNIQUE_VIOLATION) {
        throw (error as Error).message;
      }
      throw error;
    }
  }

  async deletePendingRequest({ fromUserId, toUserId }: DeletePendingRequestInput): Promise<number> {
    const result = await this.query(`DELETE FROM friend_requests WHERE from_user_id = $1 AND to_user_id = $2`, [
      fromUserId,
      toUserId
    ]);
    return result.rowCount ?? 0;
  }

  async deleteAllRequestsBetweenUsers({ fromUserId, toUserId }: DeleteAllRequestsBetweenUsersInput): Promise<void> {
    await this.query(
      `
        DELETE FROM friend_requests
        WHERE (from_user_id = $1 AND to_user_id = $2)
           OR (from_user_id = $2 AND to_user_id = $1)
      `,
      [fromUserId, toUserId]
    );
  }

  async countOutgoingRequestsCreatedOnUtcDay({
    fromUserId,
    dayStart,
    dayEndExclusive
  }: CountOutgoingRequestsCreatedOnUtcDayInput): Promise<number> {
    const result = await this.query<{ count: string }>(
      `
        SELECT COUNT(*)::text AS count
        FROM friend_requests
        WHERE from_user_id = $1
          AND created_at >= $2
          AND created_at < $3
      `,
      [fromUserId, dayStart, dayEndExclusive]
    );
    return Number(result.rows[0]?.count ?? 0);
  }
}
