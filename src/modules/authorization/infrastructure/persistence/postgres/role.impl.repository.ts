import { RoleEntity } from '@/modules/authorization/domain/entities/role.entity';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import {
  CreateRoleInput,
  ListRolesInput,
  UpdateRoleInput
} from '@/modules/authorization/domain/repositories/role.repository.type';
import { RoleName } from '@/modules/authorization/domain/value-objects/role-name.value-object';
import { RoleMapper } from '@/modules/authorization/infrastructure/persistence/postgres/role.mapper';
import { RoleModel } from '@/modules/authorization/infrastructure/persistence/postgres/role.model';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import type { Pool } from 'pg';

const roleSelect = `
  SELECT
    r.*,
    COALESCE(
      array_agg(rp.permission_id ORDER BY rp.position) FILTER (WHERE rp.permission_id IS NOT NULL),
      ARRAY[]::text[]
    ) AS permission_ids
  FROM roles r
  LEFT JOIN role_permissions rp ON rp.role_id = r.id
`;

const roleGroupBy = `GROUP BY r.id, r.name, r.description, r.is_active, r.created_at, r.updated_at`;

export class RoleRepository extends PostgresRepositoryBase<RoleEntity, RoleModel> implements RoleRepositoryPort {
  protected tableName = 'roles';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: RoleMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async findById(id: string): Promise<RoleEntity | null> {
    return this.findRoleById(id);
  }

  async findAll(): Promise<RoleEntity[]> {
    const result = await this.query<RoleModel>(`${roleSelect} ${roleGroupBy} ORDER BY r.name ASC`);
    return result.rows.map((item) => this.mapper.toDomain(item));
  }

  async findAllByIds(ids: string[]): Promise<RoleEntity[]> {
    if (ids.length === 0) return [];
    const uniqueIds = [...new Set(ids)];
    const result = await this.query<RoleModel>(
      `${roleSelect} WHERE r.id = ANY($1::text[]) ${roleGroupBy} ORDER BY r.name ASC`,
      [uniqueIds]
    );
    return result.rows.map((item) => this.mapper.toDomain(item));
  }

  async insert(entity: RoleEntity): Promise<RoleEntity> {
    return this.insertEntity(entity);
  }

  async insertMany(entities: RoleEntity[]): Promise<RoleEntity[]> {
    if (entities.length === 0) return [];
    const inserted: RoleEntity[] = [];
    await this.transaction(async () => {
      for (const entity of entities) {
        inserted.push(await this.insertEntity(entity));
      }
    });
    return inserted;
  }

  async findRoleById(id: string): Promise<RoleEntity | null> {
    const result = await this.query<RoleModel>(`${roleSelect} WHERE r.id = $1 ${roleGroupBy} LIMIT 1`, [id]);
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async findRoleByName(name: string): Promise<RoleEntity | null> {
    const result = await this.query<RoleModel>(`${roleSelect} WHERE r.name = $1 ${roleGroupBy} LIMIT 1`, [
      RoleName.create(name).value
    ]);
    const [record] = result.rows;
    return record ? this.mapper.toDomain(record) : null;
  }

  async findRoles({ limit, skip = 0 }: ListRolesInput): Promise<RoleEntity[]> {
    const result = await this.query<RoleModel>(`${roleSelect} ${roleGroupBy} ORDER BY r.name ASC OFFSET $1 LIMIT $2`, [
      skip,
      limit
    ]);
    return result.rows.map((item) => this.mapper.toDomain(item));
  }

  async countRoles(): Promise<number> {
    return this.count();
  }

  async createRole(data: CreateRoleInput): Promise<RoleEntity | null> {
    const existing = await this.findRoleByName(data.name);
    if (existing) return existing;

    return this.insertRole(data);
  }

  async insertRole(data: CreateRoleInput): Promise<RoleEntity> {
    const entity = RoleEntity.create(data);
    return this.insertEntity(entity);
  }

  private async insertEntity(entity: RoleEntity): Promise<RoleEntity> {
    const record = this.mapper.toPersistence(entity);
    const permissionIds = entity.getProps().permissionIds;

    await this.transaction(async () => {
      await this.query(
        `
          INSERT INTO roles (id, name, description, is_active, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
        `,
        [record.id, record.name, record.description, record.is_active, record.created_at, record.updated_at]
      );
      await this.replaceRolePermissions(record.id, permissionIds);
    });

    const created = await this.findRoleById(record.id);
    if (!created) {
      throw new Error('Failed to read role after insert');
    }
    return created;
  }

  async updateRole(id: string, data: UpdateRoleInput): Promise<RoleEntity | null> {
    const current = await this.findRoleById(id);
    if (!current) return null;

    await this.transaction(async () => {
      const scalarPatch: Record<string, unknown> = {};
      if (data.name !== undefined) scalarPatch.name = RoleName.create(data.name).value;
      if (data.description !== undefined) scalarPatch.description = data.description;
      if (data.isActive !== undefined) scalarPatch.is_active = data.isActive;

      const entries = Object.entries(scalarPatch);
      if (entries.length > 0) {
        const setters = entries.map(([key], index) => `"${key}" = $${index + 2}`);
        setters.push('"updated_at" = NOW()');
        await this.query(`UPDATE roles SET ${setters.join(', ')} WHERE id = $1`, [
          id,
          ...entries.map(([, value]) => value)
        ]);
      } else if (data.permissionIds !== undefined) {
        await this.query(`UPDATE roles SET "updated_at" = NOW() WHERE id = $1`, [id]);
      }

      if (data.permissionIds !== undefined) {
        await this.replaceRolePermissions(id, data.permissionIds);
      }
    });

    return this.findRoleById(id);
  }

  async deleteRole(id: string): Promise<RoleEntity | null> {
    const current = await this.findRoleById(id);
    if (!current) return null;

    const result = await this.query(`DELETE FROM roles WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0 ? current : null;
  }

  async countRolesWithPermissionId(permissionId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      `SELECT COUNT(DISTINCT role_id)::text AS count FROM role_permissions WHERE permission_id = $1`,
      [permissionId]
    );
    return Number(result.rows[0]?.count ?? 0);
  }

  private async replaceRolePermissions(roleId: string, permissionIds: string[]): Promise<void> {
    await this.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
    if (permissionIds.length === 0) return;

    const uniquePermissionIds = [...new Set(permissionIds)];
    for (const [index, permissionId] of uniquePermissionIds.entries()) {
      await this.query(
        `
          INSERT INTO role_permissions (role_id, permission_id, position)
          VALUES ($1, $2, $3)
        `,
        [roleId, permissionId, index]
      );
    }
  }
}
