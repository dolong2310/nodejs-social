import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import { EmailAddress } from '@/modules/common/domain/value-objects/email-address.value-object';
import { Username } from '@/modules/common/domain/value-objects/username.value-object';
import type { MarkOptional, Prettify } from 'ts-essentials';

export interface UserProps {
  name: string;
  email: EmailAddress;
  password: string;
  birthday: Date;
  roleId: string;
  status: EnumUserStatus;
  totpSecret?: string;
  bio?: string;
  location?: string;
  website?: string;
  username?: Username;
  avatar?: string;
  coverPhoto?: string;
}

export interface UserPrimitiveProps extends Omit<UserProps, 'email' | 'username'> {
  email: string;
  username?: string;
}

export interface UserFullProps extends Prettify<UserPrimitiveProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

// Remove sensitive data from the user props
export interface UserSafeProps extends Prettify<Omit<UserFullProps, 'password' | 'totpSecret'>> {}

export interface UserRecordProps extends Pick<UserFullProps, 'id' | 'name' | 'username' | 'avatar'> {}

export interface CreateUserProps extends MarkOptional<UserPrimitiveProps, 'status'> {}

export enum EnumUserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BANNED = 'BANNED',
  UNKNOWN = 'UNKNOWN' // transform unknown user
}
