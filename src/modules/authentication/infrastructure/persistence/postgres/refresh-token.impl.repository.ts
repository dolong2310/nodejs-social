import { RefreshTokenEntity } from '@/modules/authentication/domain/entities/refresh-token.entity';
import { RefreshTokenRepositoryPort } from '@/modules/authentication/domain/repositories/refresh-token.repository';
import {
  ICreateRefreshTokenInput,
  IRotateRefreshTokenInput
} from '@/modules/authentication/domain/repositories/refresh-token.repository.type';
import { RefreshTokenMapper } from '@/modules/authentication/infrastructure/persistence/postgres/refresh-token.mapper';
import { RefreshTokenModel } from '@/modules/authentication/infrastructure/persistence/postgres/refresh-token.model';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import type { Pool } from 'pg';

export class RefreshTokenRepository
  extends PostgresRepositoryBase<RefreshTokenEntity, RefreshTokenModel>
  implements RefreshTokenRepositoryPort
{
  protected tableName = 'refresh_tokens';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: RefreshTokenMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async findRefreshToken(token: string): Promise<RefreshTokenEntity | null> {
    const result = await this.query<RefreshTokenModel>(`SELECT * FROM refresh_tokens WHERE token = $1 LIMIT 1`, [
      token
    ]);
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async createRefreshToken(data: ICreateRefreshTokenInput): Promise<RefreshTokenEntity> {
    const entity = RefreshTokenEntity.create(data);
    return this.insert(entity);
  }

  async deleteRefreshToken(token: string): Promise<boolean> {
    const result = await this.query(`DELETE FROM refresh_tokens WHERE token = $1`, [token]);
    return (result.rowCount ?? 0) > 0;
  }

  async deleteExpiredRefreshTokens(now: Date): Promise<number> {
    const result = await this.query(`DELETE FROM refresh_tokens WHERE expires_at < $1`, [now]);
    return result.rowCount ?? 0;
  }

  async rotateRefreshToken({ userId, oldToken, newToken, expiresAt }: IRotateRefreshTokenInput): Promise<boolean> {
    const result = await this.query(
      `
        UPDATE refresh_tokens
        SET token = $3, expires_at = $4, updated_at = NOW()
        WHERE user_id = $1 AND token = $2
      `,
      [userId, oldToken, newToken, expiresAt]
    );
    return (result.rowCount ?? 0) > 0;
  }
}
