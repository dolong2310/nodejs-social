import { UserRecordProps, UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { FindUsersForSearchInput, UserWithRole } from '@/modules/user/domain/repositories/user.query.type';

export interface UserQueryRepositoryPort {
  findSafeUserById(id: string): Promise<UserSafeProps | null>;
  findSafeUserByUsername(username: string): Promise<UserSafeProps | null>;
  findSafeUserByEmail(email: string): Promise<UserSafeProps | null>;

  findUserByIdIncludeRole(id: string): Promise<UserWithRole | null>;
  findUserByEmailIncludeRole(email: string): Promise<UserWithRole | null>;
  findUsersForSearch(data: FindUsersForSearchInput): Promise<UserSafeProps[]>;
  findManyUsersByIdsIncludeNameUsernameAvatar(ids: string[]): Promise<UserRecordProps[]>;
}
