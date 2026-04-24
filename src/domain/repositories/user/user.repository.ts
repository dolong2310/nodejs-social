import { UserEntity } from '@/domain/entities/user/user.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import {
  IChangePasswordInput,
  IResetPasswordInput,
  IUpdateMeInput
} from '@/domain/repositories/user/user.repository.type';

export type SafeUserEntity = Omit<UserEntity, 'password' | 'totpSecret'>;

export interface UserRepositoryPort extends RepositoryPort<UserEntity> {
  findSafeUserById(id: string): Promise<SafeUserEntity | null>;
  findSafeUserByUsername(username: string): Promise<SafeUserEntity | null>;
  findSafeUserByEmail(email: string): Promise<SafeUserEntity | null>;

  findUserById(id: string): Promise<UserEntity | null>;
  findUserByUsername(username: string): Promise<UserEntity | null>;
  findUserByEmail(email: string): Promise<UserEntity | null>;
  findUserByEmailIncludeNameEmail(email: string): Promise<UserEntity | null>;
  findManyUsersByIds(ids: string[]): Promise<UserEntity[]>;
  findManyUsersByIdsIncludeNameUsernameAvatar(ids: string[]): Promise<UserEntity[]>;

  updateMe(id: string, data: IUpdateMeInput): Promise<UserEntity | null>;
  resetPassword(id: string, data: IResetPasswordInput): Promise<boolean>;
  changePassword(id: string, data: IChangePasswordInput): Promise<UserEntity | null>;
}
