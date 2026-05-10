import { OtpEntity } from '@/modules/authentication/domain/entities/otp.entity';
import { EOtpType } from '@/modules/authentication/domain/entities/otp.type';
import { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import { ICreateOtpInput } from '@/modules/authentication/domain/repositories/otp.repository.type';
import { OtpMapper } from '@/modules/authentication/infrastructure/persistence/postgres/otp.mapper';
import { OtpModel } from '@/modules/authentication/infrastructure/persistence/postgres/otp.model';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import type { Pool } from 'pg';

export class OtpRepository extends PostgresRepositoryBase<OtpEntity, OtpModel> implements OtpRepositoryPort {
  protected tableName = 'otps';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: OtpMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async findUniqueOtpCode(data: { email: string; type: EOtpType }): Promise<OtpEntity | null> {
    const result = await this.query<OtpModel>(`SELECT * FROM otps WHERE email = $1 AND type = $2 LIMIT 1`, [
      data.email,
      data.type
    ]);
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async createOtp(data: ICreateOtpInput): Promise<OtpEntity | null> {
    const entity = OtpEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    const result = await this.query<OtpModel>(
      `
        INSERT INTO otps (id, email, code, type, expires_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (email, type)
        DO UPDATE SET
          code = EXCLUDED.code,
          expires_at = EXCLUDED.expires_at,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `,
      [record.id, record.email, record.code, record.type, record.expires_at, record.created_at, record.updated_at]
    );
    const [created] = result.rows;
    return created ? this.mapper.toDomain(created) : null;
  }

  async deleteOtp(id: string): Promise<OtpEntity | null> {
    const result = await this.query<OtpModel>(`DELETE FROM otps WHERE id = $1 RETURNING *`, [id]);
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async deleteExpiredOtps(now: Date): Promise<number> {
    const result = await this.query(`DELETE FROM otps WHERE expires_at < $1`, [now]);
    return result.rowCount ?? 0;
  }
}
