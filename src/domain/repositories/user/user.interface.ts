import { UserEntity } from '@/domain/entities/user.entity';

export interface ICreateUserInput extends Pick<
  UserEntity,
  'id' | 'name' | 'email' | 'password' | 'dateOfBirth' | 'emailVerificationToken' | 'verificationStatus' | 'username'
> {}

export interface IUpdateMeInput extends Pick<
  UserEntity,
  'id' | 'name' | 'dateOfBirth' | 'bio' | 'location' | 'website' | 'username' | 'avatar' | 'coverPhoto'
> {}

export interface IUpdateEmailVerificationInput extends Pick<UserEntity, 'id'> {}

export interface IUpdateEmailVerificationTokenInput extends Pick<UserEntity, 'id' | 'emailVerificationToken'> {}

export interface IUpdateForgotPasswordTokenInput extends Pick<UserEntity, 'id' | 'forgotPasswordToken'> {}

export interface IResetPasswordInput extends Pick<UserEntity, 'id' | 'password'> {}

export interface IChangePasswordInput extends Pick<UserEntity, 'id' | 'password'> {}

export interface IFindUserByIdInput extends Pick<UserEntity, 'id'> {}

export interface IFindUserByEmailInput extends Pick<UserEntity, 'email'> {}

export interface IFindUserByUsernameInput extends Pick<UserEntity, 'username'> {}

export interface IFindManyUsersByIdsInput {
  ids: string[];
}

export interface IFindManyUsersByIdsIncludeNameUsernameAvatarInput {
  ids: string[];
}
