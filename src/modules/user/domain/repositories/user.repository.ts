import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import {
  IChangePasswordInput,
  IResetPasswordInput,
  IUpdateMeInput
} from '@/modules/user/domain/repositories/user.repository.type';

export interface UserRepositoryPort extends RepositoryPort<UserEntity> {
  findUserById(id: string): Promise<UserEntity | null>;
  findUserByUsername(username: string): Promise<UserEntity | null>;
  findUserByEmail(email: string): Promise<UserEntity | null>;
  findUserByEmailIncludeNameEmail(email: string): Promise<UserEntity | null>;
  findManyUsersByIds(ids: string[]): Promise<UserEntity[]>;

  updateMe(id: string, data: IUpdateMeInput): Promise<UserEntity | null>;
  resetPassword(id: string, data: IResetPasswordInput): Promise<boolean>;
  changePassword(id: string, data: IChangePasswordInput): Promise<UserEntity | null>;
}
