import { PermissionFullProps } from '@/modules/authorization/domain/entities/permission.types';
import { RoleFullProps } from '@/modules/authorization/domain/entities/role.types';
import type { Prettify } from 'ts-essentials';

export type RoleWithPermissions = Prettify<
  Omit<RoleFullProps, 'permissionIds'> & { permissions: PermissionFullProps[] }
>;
