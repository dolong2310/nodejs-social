import { RoleEntity } from '@/modules/authorization/domain/entities/role.entity';
import {
  ICreateRoleInput,
  IListRolesInput,
  IUpdateRoleInput
} from '@/modules/authorization/domain/repositories/role.repository.type';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';

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
