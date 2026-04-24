import { RoleFullProps } from '@/domain/entities/role/role.type';
import { UserFullProps, UserSafeProps } from '@/domain/entities/user/user.type';
import { ESearchPeople } from '@/domain/enums/search.enum';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';
import { Prettify } from 'ts-essentials';

export type UserWithRole = Prettify<UserFullProps & { role: RoleFullProps | null }>;

export interface IFindUsersForSearchInput {
  userId?: string;
  query: string;
  people?: ESearchPeople;
  limit: number;
  cursor?: DateIdCursor;
  findFriendUserIds(userId: string): Promise<string[]>;
}

export interface UserQueryRepositoryPort {
  findUserByIdIncludeRole(id: string): Promise<UserWithRole | null>;
  findUsersForSearch(data: IFindUsersForSearchInput): Promise<UserSafeProps[]>;
}
