import { IUser } from '@/domain/entities/user.entity';
import {
  IChangePasswordInput,
  ICreateUserInput,
  IFindManyUsersByIdsIncludeNameUsernameAvatarInput,
  IFindManyUsersByIdsInput,
  IFindUserByEmailInput,
  IFindUserByIdInput,
  IFindUserByUsernameInput,
  IResetPasswordInput,
  IUpdateEmailVerificationInput,
  IUpdateEmailVerificationTokenInput,
  IUpdateForgotPasswordTokenInput,
  IUpdateMeInput
} from '@/domain/repositories/user/user.interface';

export interface IUserRepository {
  createUser(data: ICreateUserInput): Promise<IUser>;
  updateMe(data: IUpdateMeInput): Promise<IUser | null>;
  updateEmailVerification(data: IUpdateEmailVerificationInput): Promise<boolean>;
  updateEmailVerificationToken(data: IUpdateEmailVerificationTokenInput): Promise<boolean>;
  updateForgotPasswordToken(data: IUpdateForgotPasswordTokenInput): Promise<boolean>;
  resetPassword(data: IResetPasswordInput): Promise<boolean>;
  changePassword(data: IChangePasswordInput): Promise<IUser | null>;
  findUserById(data: IFindUserByIdInput): Promise<IUser | null>;
  findUserByEmail(data: IFindUserByEmailInput): Promise<IUser | null>;
  findUserByEmailIncludeNameEmail(data: IFindUserByEmailInput): Promise<IUser | null>;
  findUserByUsername(data: IFindUserByUsernameInput): Promise<IUser | null>;
  findManyUsersByIds(data: IFindManyUsersByIdsInput): Promise<IUser[]>;
  findManyUsersByIdsIncludeNameUsernameAvatar(
    data: IFindManyUsersByIdsIncludeNameUsernameAvatarInput
  ): Promise<IUser[]>;
}
