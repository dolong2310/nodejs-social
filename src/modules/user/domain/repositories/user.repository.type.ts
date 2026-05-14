import { UserProps } from '@/modules/user/domain/entities/user.type';

export interface UpdateMeInput extends Pick<
  UserProps,
  'name' | 'birthday' | 'bio' | 'location' | 'website' | 'username' | 'avatar' | 'coverPhoto'
> {}

export interface ResetPasswordInput extends Pick<UserProps, 'password'> {}

export interface ChangePasswordInput extends Pick<UserProps, 'password'> {}
