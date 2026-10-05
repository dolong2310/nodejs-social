import type { RoleWithPermissions } from '@/modules/authorization/domain/repositories/role.query.types';

export interface RoleQueryRepositoryPort {
  findRoleWithPermissionsById(id: string): Promise<RoleWithPermissions | null>;
}
