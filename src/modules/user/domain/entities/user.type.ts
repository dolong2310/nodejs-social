import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import type { MarkOptional, Prettify } from 'ts-essentials';

export interface UserProps {
  name: string;
  email: string;
  password: string;
  birthday: Date;
  roleId: string;
  status: EnumUserStatus;
  totpSecret?: string;
  bio?: string;
  location?: string;
  website?: string;
  username?: string;
  avatar?: string;
  coverPhoto?: string;
}

export interface UserFullProps extends Prettify<UserProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

// Remove sensitive data from the user props
export interface UserSafeProps extends Prettify<Omit<UserFullProps, 'password' | 'totpSecret'>> {}

export interface UserRecordProps extends Pick<UserFullProps, 'id' | 'name' | 'username' | 'avatar'> {}

export interface CreateUserProps extends MarkOptional<UserProps, 'status'> {}

export enum EnumUserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED',
  UNKNOWN = 'UNKNOWN' // transform unknown user
}
