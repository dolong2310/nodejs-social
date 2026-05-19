import { EnumSearchPeople } from '@/modules/common/domain/enums/search.enum';
import { DateIdCursor } from '@/modules/common/domain/value-objects/cursor.value-object';
import { UserFullProps } from '@/modules/user/domain/entities/user.type';
import { Prettify } from 'ts-essentials';

export interface FindUsersForSearchInput {
  userId?: string;
  query: string;
  people?: EnumSearchPeople;
  limit: number;
  cursor?: DateIdCursor;
  findFriendUserIds(userId: string): Promise<string[]>;
}

// Output

// reference from RoleFullProps
export type RoleFullProps = {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  permissionIds: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  createdById: string | null;
  updatedById: string | null;
  deletedById: string | null;
};

export type UserWithRole = Prettify<UserFullProps & { role: RoleFullProps | null }>;
