import { PermissionFullProps } from '@/modules/authorization/domain/entities/permission.type';
import { RoleFullProps } from '@/modules/authorization/domain/entities/role.type';
import type { Prettify } from 'ts-essentials';

export type RoleWithPermissions = Prettify<
  Omit<RoleFullProps, 'permissionIds'> & { permissions: PermissionFullProps[] }
>;
