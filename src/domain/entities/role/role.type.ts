import { BaseEntityProps } from '@/domain/entities/base/base.entity';
import type { MarkOptional, Prettify } from 'ts-essentials';

export interface RoleProps {
  name: ERoleName;
  description: string;
  isActive: boolean;
  permissionIds: string[];
}

// Properties that are needed for a role retrieval
export interface RoleFullProps extends Prettify<RoleProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

// Properties that are needed for a role creation
export interface CreateRoleProps extends MarkOptional<RoleProps, 'description' | 'permissionIds'> {}

export enum ERoleName {
  ADMIN = 'ADMIN',
  USER = 'USER'
}
