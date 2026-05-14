import { EnumHttpMethod } from '@/modules/authorization/domain/entities/permission.type';
import { RoleQueryRepositoryPort } from '@/modules/authorization/domain/repositories/role.query.repository';
import { RoleWithPermissions } from '@/modules/authorization/domain/repositories/role.query.type';
import type { Pool } from 'pg';

type RolePermissionJoinModel = {
  id: string;
  name: string;
  description: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
  permission_id: string | null;
  permission_name: string | null;
  permission_description: string | null;
  permission_path: string | null;
  permission_method: EnumHttpMethod | null;
  permission_module: string | null;
  permission_created_at: Date | null;
  permission_updated_at: Date | null;
};

export class RoleQueryRepository implements RoleQueryRepositoryPort {
  constructor(protected readonly pool: Pool) {}

  async findRoleWithPermissionsById(id: string): Promise<RoleWithPermissions | null> {
    const result = await this.pool.query<RolePermissionJoinModel>(
      `
        SELECT
          r.id,
          r.name,
          r.description,
          r.is_active,
          r.created_at,
          r.updated_at,
          p.id AS permission_id,
          p.name AS permission_name,
          p.description AS permission_description,
          p.path AS permission_path,
          p.method AS permission_method,
          p.module AS permission_module,
          p.created_at AS permission_created_at,
          p.updated_at AS permission_updated_at
        FROM roles r
        LEFT JOIN role_permissions rp ON rp.role_id = r.id
        LEFT JOIN permissions p ON p.id = rp.permission_id
        WHERE r.id = $1
        ORDER BY rp.position ASC
      `,
      [id]
    );

    const [first] = result.rows;
    if (!first) return null;

    return {
      id: first.id,
      name: first.name,
      description: first.description,
      isActive: first.is_active,
      createdAt: first.created_at,
      updatedAt: first.updated_at,
      permissions: result.rows
        .filter((row) => row.permission_id !== null)
        .map((row) => ({
          id: row.permission_id as string,
          name: row.permission_name as string,
          description: row.permission_description as string,
          path: row.permission_path as string,
          method: row.permission_method as EnumHttpMethod,
          module: row.permission_module as string,
          createdAt: row.permission_created_at as Date,
          updatedAt: row.permission_updated_at as Date
        }))
    };
  }
}
