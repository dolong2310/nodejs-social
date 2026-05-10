import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { normalizeUserEmail, normalizeUsername } from '@/modules/user/domain/helpers/user-normalization.helper';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import {
  IChangePasswordInput,
  IResetPasswordInput,
  IUpdateMeInput
} from '@/modules/user/domain/repositories/user.repository.type';
import { UserMapper } from '@/modules/user/infrastructure/persistence/postgres/user.mapper';
import { UserModel } from '@/modules/user/infrastructure/persistence/postgres/user.model';
import type { Pool } from 'pg';

export class UserRepository extends PostgresRepositoryBase<UserEntity, UserModel> implements UserRepositoryPort {
  protected tableName = 'users';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: UserMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async findUserById(id: string): Promise<UserEntity | null> {
    return this.findById(id);
  }

  async findUserByUsername(username: string): Promise<UserEntity | null> {
    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername) return null;

    return this.findOne({ username: normalizedUsername } as Partial<UserEntity>);
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    return this.findOne({ email: normalizeUserEmail(email) } as Partial<UserEntity>);
  }

  async findUserByEmailIncludeNameEmail(email: string): Promise<UserEntity | null> {
    return this.findUserByEmail(email);
  }

  async findManyUsersByIds(ids: string[]): Promise<UserEntity[]> {
    return this.findAllByIds(ids);
  }

  async updateMe(id: string, data: IUpdateMeInput): Promise<UserEntity | null> {
    return this.update(id, { ...data, username: normalizeUsername(data.username) } as Partial<UserEntity>);
  }

  async resetPassword(id: string, data: IResetPasswordInput): Promise<boolean> {
    const result = await this.query(`UPDATE "users" SET "password" = $2, "updated_at" = NOW() WHERE "id" = $1`, [
      id,
      data.password
    ]);
    return (result.rowCount ?? 0) > 0;
  }

  async changePassword(id: string, data: IChangePasswordInput): Promise<UserEntity | null> {
    const result = await this.query<UserModel>(
      `UPDATE "users" SET "password" = $2, "updated_at" = NOW() WHERE "id" = $1 RETURNING *`,
      [id, data.password]
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }
}
