import { RoleFullProps } from '@/modules/role/domain/entities/role.type';
import { UserFullProps } from '@/modules/user/domain/entities/user.type';
import { ESearchPeople } from '@/modules/core/domain/enums/search.enum';
import { DateIdCursor } from '@/modules/core/domain/value-objects/date-id-cursor.value-object';
import { Prettify } from 'ts-essentials';

export interface IFindUsersForSearchInput {
  userId?: string;
  query: string;
  people?: ESearchPeople;
  limit: number;
  cursor?: DateIdCursor;
  findFriendUserIds(userId: string): Promise<string[]>;
}

// Output

export type UserWithRole = Prettify<UserFullProps & { role: RoleFullProps | null }>;
