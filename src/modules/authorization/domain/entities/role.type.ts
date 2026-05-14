import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import type { MarkOptional, Prettify } from 'ts-essentials';

export interface RoleProps {
  name: string;
  description: string;
  isActive: boolean;
  permissionIds: string[];
}

export interface RoleFullProps extends Prettify<RoleProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

export interface CreateRoleProps extends MarkOptional<RoleProps, 'description' | 'permissionIds'> {}

/** Tên role mặc định hệ thống (seed) — dùng khi cần so khớp cố định. */
export enum EnumRoleName {
  ADMIN = 'ADMIN',
  USER = 'USER'
}
