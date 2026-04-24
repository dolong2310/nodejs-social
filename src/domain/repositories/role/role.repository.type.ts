import { CreateRoleProps, RoleFullProps } from '@/domain/entities/role/role.type';

export interface ICreateRoleInput extends CreateRoleProps {}

export interface IUpdateRoleInput extends Pick<RoleFullProps, 'name' | 'description' | 'isActive' | 'permissionIds'> {}
