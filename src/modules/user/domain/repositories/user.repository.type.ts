import { UserPrimitiveProps } from '@/modules/user/domain/entities/user.type';

export interface UpdateMeInput extends Pick<
  UserPrimitiveProps,
  'name' | 'birthday' | 'bio' | 'location' | 'website' | 'username' | 'avatar' | 'coverPhoto'
> {}

export interface ResetPasswordInput extends Pick<UserPrimitiveProps, 'password'> {}

export interface ChangePasswordInput extends Pick<UserPrimitiveProps, 'password'> {}
