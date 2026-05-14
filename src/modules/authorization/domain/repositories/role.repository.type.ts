import { CreateRoleProps } from '@/modules/authorization/domain/entities/role.type';
import { MarkOptional } from 'ts-essentials';

export interface CreateRoleInput extends CreateRoleProps {}

export interface UpdateRoleInput extends MarkOptional<
  CreateRoleProps,
  'name' | 'description' | 'isActive' | 'permissionIds'
> {}

export interface ListRolesInput {
  limit: number;
  skip?: number;
}
