import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import { NotificationEntity } from '@/modules/notification/domain/entities/notification.entity';
import { NotificationRepositoryPort } from '@/modules/notification/domain/repositories/notification.repository';
import {
  FindNotificationsInput,
  FindOldestNotificationIdsForTrimInput,
  UpdateReadByIdsInput
} from '@/modules/notification/domain/repositories/notification.repository.type';
import { NotificationMapper } from '@/modules/notification/infrastructure/persistence/postgres/notification.mapper';
import { NotificationModel } from '@/modules/notification/infrastructure/persistence/postgres/notification.model';
import type { Pool } from 'pg';

export class NotificationRepository
  extends PostgresRepositoryBase<NotificationEntity, NotificationModel>
  implements NotificationRepositoryPort
{
  protected tableName = 'notifications';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: NotificationMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async findNotifications({
    recipientId,
    actorUserIdNin,
    unreadOnly,
    limit,
    before
  }: FindNotificationsInput): Promise<NotificationEntity[]> {
    const conditions = ['recipient_id = $1', 'deleted_at IS NULL'];
    const values: unknown[] = [recipientId];

    if (actorUserIdNin && actorUserIdNin.length > 0) {
      values.push(actorUserIdNin);
      conditions.push(`actor->>'userId' <> ALL($${values.length}::text[])`);
    }

    if (unreadOnly) {
      conditions.push('read = FALSE');
    }

    if (before) {
      const cursor = before.raw();
      values.push(cursor.createdAt, cursor.id);
      conditions.push(
        `(created_at < $${values.length - 1} OR (created_at = $${values.length - 1} AND id < $${values.length}))`
      );
    }

    values.push(limit);
    const result = await this.query<NotificationModel>(
      `
        SELECT *
        FROM notifications
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC, id DESC
        LIMIT $${values.length}
      `,
      values
    );
    return result.rows.map((record) => this.mapper.toDomain(record));
  }

  /** Prefer read documents first, then oldest by createdAt. */
  async findOldestNotificationIdsForTrim({
    recipientId,
    limit
  }: FindOldestNotificationIdsForTrimInput): Promise<string[]> {
    if (limit <= 0) return [];
    const result = await this.query<Pick<NotificationModel, 'id'>>(
      `
        SELECT id
        FROM notifications
        WHERE recipient_id = $1 AND deleted_at IS NULL
        ORDER BY read DESC, created_at ASC, id ASC
        LIMIT $2
      `,
      [recipientId, limit]
    );
    return result.rows.map((notification) => notification.id);
  }

  async createNotification(data: NotificationEntity): Promise<NotificationEntity> {
    const record = this.mapper.toPersistence(data);
    const result = await this.query<NotificationModel>(
      `
        INSERT INTO notifications (
          id,
          recipient_id,
          read,
          read_at,
          type,
          actor,
          payload,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, $9)
        RETURNING *
      `,
      [
        record.id,
        record.recipient_id,
        record.read,
        record.read_at,
        record.type,
        JSON.stringify(record.actor),
        JSON.stringify(record.payload),
        record.created_at,
        record.updated_at
      ]
    );
    return this.mapper.toDomain(result.rows[0] ?? record);
  }

  async createNotifications(data: NotificationEntity[]): Promise<void> {
    if (data.length === 0) return;
    const records = data.map((entity) => this.mapper.toPersistence(entity));
    const values: unknown[] = [];
    const rows = records.map((record, index) => {
      const offset = index * 9;
      values.push(
        record.id,
        record.recipient_id,
        record.read,
        record.read_at,
        record.type,
        JSON.stringify(record.actor),
        JSON.stringify(record.payload),
        record.created_at,
        record.updated_at
      );
      return `($${offset + 1}, $${offset + 2}, $${offset + 3}, $${offset + 4}, $${offset + 5}, $${offset + 6}::jsonb, $${offset + 7}::jsonb, $${offset + 8}, $${offset + 9})`;
    });

    await this.query(
      `
        INSERT INTO notifications (
          id,
          recipient_id,
          read,
          read_at,
          type,
          actor,
          payload,
          created_at,
          updated_at
        )
        VALUES ${rows.join(', ')}
      `,
      values
    );
  }

  async updateReadByIds({ ids, recipientId }: UpdateReadByIdsInput): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await this.query(
      `
        UPDATE notifications
        SET read = TRUE, read_at = NOW(), updated_at = NOW()
        WHERE recipient_id = $1 AND id = ANY($2::text[]) AND read = FALSE AND deleted_at IS NULL
      `,
      [recipientId, ids]
    );
    return result.rowCount ?? 0;
  }

  async updateAllRead(recipientId: string): Promise<number> {
    const result = await this.query(
      `
        UPDATE notifications
        SET read = TRUE, read_at = NOW(), updated_at = NOW()
        WHERE recipient_id = $1 AND read = FALSE AND deleted_at IS NULL
      `,
      [recipientId]
    );
    return result.rowCount ?? 0;
  }

  async deleteNotificationsByIds(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const result = await this.query(`DELETE FROM notifications WHERE id = ANY($1::text[])`, [ids]);
    return result.rowCount ?? 0;
  }

  async countForRecipient(recipientId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(*)::text AS count FROM notifications WHERE recipient_id = $1 AND deleted_at IS NULL`,
      [recipientId]
    );
    return Number(result.rows[0]?.count ?? 0);
  }
}
