import { IFindUsersForSearchInput, UserWithRole } from '@/modules/user/application/ports/queries/user-query.type';
import { UserRecordProps, UserSafeProps } from '@/modules/user/domain/entities/user.type';

export interface UserQueryRepositoryPort {
  findSafeUserById(id: string): Promise<UserSafeProps | null>;
  findSafeUserByUsername(username: string): Promise<UserSafeProps | null>;
  findSafeUserByEmail(email: string): Promise<UserSafeProps | null>;

  findUserByIdIncludeRole(id: string): Promise<UserWithRole | null>;
  findUserByEmailIncludeRole(email: string): Promise<UserWithRole | null>;
  findUsersForSearch(data: IFindUsersForSearchInput): Promise<UserSafeProps[]>;
  findManyUsersByIdsIncludeNameUsernameAvatar(ids: string[]): Promise<UserRecordProps[]>;
}
