import { RoleWithPermissions } from '@/modules/role/application/ports/queries/role-query.type';

export interface RoleQueryRepositoryPort {
  findRoleWithPermissionsById(id: string): Promise<RoleWithPermissions | null>;
}
