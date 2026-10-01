import type { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import type { UserEntity } from '@/modules/user/domain/entities/user.entity';
import type {
  ChangePasswordInput,
  ResetPasswordInput,
  UpdateMeInput
} from '@/modules/user/domain/repositories/user.repository.types';

export interface UserRepositoryPort extends RepositoryPort<UserEntity> {
  findUserById(id: string): Promise<UserEntity | null>;
  findUserByUsername(username: string): Promise<UserEntity | null>;
  findUserByEmail(email: string): Promise<UserEntity | null>;
  findUserByEmailIncludeNameEmail(email: string): Promise<UserEntity | null>;
  findManyUsersByIds(ids: string[]): Promise<UserEntity[]>;

  updateMe(id: string, data: UpdateMeInput): Promise<UserEntity | null>;
  resetPassword(id: string, data: ResetPasswordInput): Promise<boolean>;
  changePassword(id: string, data: ChangePasswordInput): Promise<UserEntity | null>;
}
