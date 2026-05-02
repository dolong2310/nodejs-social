import { RoleEntity } from '@/modules/role/domain/entities/role.entity';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { ICreateRoleInput, IListRolesInput, IUpdateRoleInput } from '@/modules/role/domain/repositories/role.repository.type';

export interface RoleRepositoryPort extends RepositoryPort<RoleEntity> {
  findRoleById(id: string): Promise<RoleEntity | null>;
  findRoleByName(name: string): Promise<RoleEntity | null>;
  findRoles(data: IListRolesInput): Promise<RoleEntity[]>;
  countRoles(): Promise<number>;
  createRole(data: ICreateRoleInput): Promise<RoleEntity | null>;
  insertRole(data: ICreateRoleInput): Promise<RoleEntity>;
  updateRole(id: string, data: IUpdateRoleInput): Promise<RoleEntity | null>;
  deleteRole(id: string): Promise<RoleEntity | null>;
  countRolesWithPermissionId(permissionId: string): Promise<number>;
}
