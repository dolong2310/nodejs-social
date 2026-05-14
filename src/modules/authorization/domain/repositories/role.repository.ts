import { RoleEntity } from '@/modules/authorization/domain/entities/role.entity';
import {
  CreateRoleInput,
  ListRolesInput,
  UpdateRoleInput
} from '@/modules/authorization/domain/repositories/role.repository.type';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';

export interface RoleRepositoryPort extends RepositoryPort<RoleEntity> {
  findRoleById(id: string): Promise<RoleEntity | null>;
  findRoleByName(name: string): Promise<RoleEntity | null>;
  findRoles(data: ListRolesInput): Promise<RoleEntity[]>;
  countRoles(): Promise<number>;
  createRole(data: CreateRoleInput): Promise<RoleEntity | null>;
  insertRole(data: CreateRoleInput): Promise<RoleEntity>;
  updateRole(id: string, data: UpdateRoleInput): Promise<RoleEntity | null>;
  deleteRole(id: string): Promise<RoleEntity | null>;
  countRolesWithPermissionId(permissionId: string): Promise<number>;
}
