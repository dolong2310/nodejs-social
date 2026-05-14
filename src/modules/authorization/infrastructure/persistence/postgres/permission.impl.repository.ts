import { PermissionEntity } from '@/modules/authorization/domain/entities/permission.entity';
import { PermissionRepositoryPort } from '@/modules/authorization/domain/repositories/permission.repository';
import {
  CreatePermissionInput,
  FindPermissionByPathAndMethodInput,
  ListPermissionsInput,
  UpdatePermissionInput
} from '@/modules/authorization/domain/repositories/permission.repository.type';
import { PermissionMapper } from '@/modules/authorization/infrastructure/persistence/postgres/permission.mapper';
import { PermissionModel } from '@/modules/authorization/infrastructure/persistence/postgres/permission.model';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import type { Pool } from 'pg';

export class PermissionRepository
  extends PostgresRepositoryBase<PermissionEntity, PermissionModel>
  implements PermissionRepositoryPort
{
  protected tableName = 'permissions';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: PermissionMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async findPermissions({ limit, skip = 0 }: ListPermissionsInput): Promise<PermissionEntity[]> {
    const result = await this.query<PermissionModel>(
      `SELECT * FROM "permissions" ORDER BY "path" ASC, "method" ASC OFFSET $1 LIMIT $2`,
      [skip, limit]
    );
    return result.rows.map((item) => this.mapper.toDomain(item));
  }

  async countPermissions(): Promise<number> {
    return this.count();
  }

  async findPermissionById(id: string): Promise<PermissionEntity | null> {
    return this.findById(id);
  }

  async findPermissionByPathAndMethod({
    path,
    method,
    excludeId
  }: FindPermissionByPathAndMethodInput): Promise<PermissionEntity | null> {
    const values: unknown[] = [path, method];
    const excludeClause = excludeId === undefined ? '' : ' AND "id" <> $3';
    if (excludeId !== undefined) values.push(excludeId);

    const result = await this.query<PermissionModel>(
      `SELECT * FROM "permissions" WHERE "path" = $1 AND "method" = $2${excludeClause} LIMIT 1`,
      values
    );
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async createPermissions(data: CreatePermissionInput[]): Promise<PermissionEntity[]> {
    const entities = data.map((item) => PermissionEntity.create(item));
    return this.insertMany(entities);
  }

  async createPermission(data: CreatePermissionInput): Promise<PermissionEntity | null> {
    const entity = PermissionEntity.create(data);
    return this.insert(entity);
  }

  async updatePermission(id: string, data: UpdatePermissionInput): Promise<PermissionEntity | null> {
    return this.update(id, data as Partial<PermissionEntity>);
  }

  async deletePermission(id: string): Promise<PermissionEntity | null> {
    const result = await this.query<PermissionModel>(`DELETE FROM "permissions" WHERE "id" = $1 RETURNING *`, [id]);
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async deletePermissions(ids: string[]): Promise<number> {
    if (ids.length === 0) return 0;
    const uniqueIds = [...new Set(ids)];
    const result = await this.query(`DELETE FROM "permissions" WHERE "id" = ANY($1::text[])`, [uniqueIds]);
    return result.rowCount ?? 0;
  }
}
