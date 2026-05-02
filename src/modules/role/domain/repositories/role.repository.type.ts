import { CreateRoleProps } from '@/modules/role/domain/entities/role.type';
import { MarkOptional } from 'ts-essentials';

export interface ICreateRoleInput extends CreateRoleProps {}

export interface IUpdateRoleInput extends MarkOptional<
  CreateRoleProps,
  'name' | 'description' | 'isActive' | 'permissionIds'
> {}

export interface IListRolesInput {
  limit: number;
  skip?: number;
}
