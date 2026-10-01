import type { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import type { RoleName } from '@/modules/authorization/domain/value-objects/role-name.value-object';
import type { MarkOptional, Prettify } from 'ts-essentials';

export interface RoleProps {
  name: RoleName;
  description: string;
  isActive: boolean;
  permissionIds: string[];
}

export interface RolePrimitiveProps extends Omit<RoleProps, 'name'> {
  name: string;
}

export interface RoleFullProps extends Prettify<RolePrimitiveProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

export interface CreateRoleProps extends MarkOptional<RolePrimitiveProps, 'description' | 'permissionIds'> {}

/** Default system role names created by seed data; use when fixed matching is required. */
export enum EnumRoleName {
  ADMIN = 'ADMIN',
  USER = 'USER'
}
