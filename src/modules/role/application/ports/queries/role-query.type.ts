import { PermissionFullProps } from '@/modules/permission/domain/entities/permission.type';
import { RoleFullProps } from '@/modules/role/domain/entities/role.type';
import type { Prettify } from 'ts-essentials';

export type RoleWithPermissions = Prettify<
  Omit<RoleFullProps, 'permissionIds'> & { permissions: PermissionFullProps[] }
>;
