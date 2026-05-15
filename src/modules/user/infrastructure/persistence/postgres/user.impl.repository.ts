import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import { EmailAddress } from '@/modules/common/domain/value-objects/email-address.value-object';
import { Username } from '@/modules/common/domain/value-objects/username.value-object';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import {
  ChangePasswordInput,
  ResetPasswordInput,
  UpdateMeInput
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
    const normalizedUsername = Username.normalize(username);
    if (!normalizedUsername) return null;

    return this.findOne({ username: normalizedUsername } as Partial<UserEntity>);
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    return this.findOne({ email: EmailAddress.create(email).value } as Partial<UserEntity>);
  }

  async findUserByEmailIncludeNameEmail(email: string): Promise<UserEntity | null> {
    return this.findUserByEmail(email);
  }

  async findManyUsersByIds(ids: string[]): Promise<UserEntity[]> {
    return this.findAllByIds(ids);
  }

  async updateMe(id: string, data: UpdateMeInput): Promise<UserEntity | null> {
    return this.update(id, { ...data, username: Username.normalize(data.username) } as Partial<UserEntity>);
  }

  async resetPassword(id: string, data: ResetPasswordInput): Promise<boolean> {
    const result = await this.query(`UPDATE "users" SET "password" = $2, "updated_at" = NOW() WHERE "id" = $1`, [
      id,
      data.password
    ]);
    return (result.rowCount ?? 0) > 0;
  }

  async changePassword(id: string, data: ChangePasswordInput): Promise<UserEntity | null> {
    const result = await this.query<UserModel>(
      `UPDATE "users" SET "password" = $2, "updated_at" = NOW() WHERE "id" = $1 RETURNING *`,
      [id, data.password]
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }
}
