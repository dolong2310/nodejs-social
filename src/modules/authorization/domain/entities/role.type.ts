import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import { RoleName } from '@/modules/authorization/domain/value-objects/role-name.value-object';
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

/** Tên role mặc định hệ thống (seed) — dùng khi cần so khớp cố định. */
export enum EnumRoleName {
  ADMIN = 'ADMIN',
  USER = 'USER'
}
