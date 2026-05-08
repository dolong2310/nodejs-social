import { RoleWithPermissions } from '@/modules/authorization/domain/repositories/role.query.type';

export interface RoleQueryRepositoryPort {
  findRoleWithPermissionsById(id: string): Promise<RoleWithPermissions | null>;
}
