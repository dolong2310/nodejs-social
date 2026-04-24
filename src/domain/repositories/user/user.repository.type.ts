import { UserProps } from '@/domain/entities/user/user.type';

export interface IUpdateMeInput extends Pick<
  UserProps,
  'name' | 'birthday' | 'bio' | 'location' | 'website' | 'username' | 'avatar' | 'coverPhoto'
> {}

export interface IResetPasswordInput extends Pick<UserProps, 'password'> {}

export interface IChangePasswordInput extends Pick<UserProps, 'password'> {}
