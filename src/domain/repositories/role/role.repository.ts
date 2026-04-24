import { RoleEntity } from '@/domain/entities/role/role.entity';
import { ERoleName } from '@/domain/entities/role/role.type';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import { ICreateRoleInput, IUpdateRoleInput } from '@/domain/repositories/role/role.repository.type';

export interface RoleRepositoryPort extends RepositoryPort<RoleEntity> {
  findRoleById(id: string): Promise<RoleEntity | null>;
  findRoleByName(name: ERoleName): Promise<RoleEntity | null>;
  createRole(data: ICreateRoleInput): Promise<RoleEntity | null>;
  updateRole(id: string, data: IUpdateRoleInput): Promise<RoleEntity | null>;
  deleteRole(id: string): Promise<RoleEntity | null>;
}
