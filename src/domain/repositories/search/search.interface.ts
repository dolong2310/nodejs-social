import { IPost } from '@/domain/entities/post.entity';
import { IUser } from '@/domain/entities/user.entity';
import { ESearchPeople, ESearchType } from '@/domain/enums/search.enum';
import { DateIdCursor } from '@/domain/value-objects/date-id-cursor.value-object';

export interface IFindPostsForSearchInput {
  userId?: string;
  query: string;
  type?: ESearchType;
  people?: ESearchPeople;
  limit: number;
  cursor?: DateIdCursor;
  findFriendUserIds(userId: string): Promise<string[]>;
  blockedAuthorIds?: string[];
  extraVisiblePostIds?: string[];
}

export interface IFindUsersForSearchInput {
  userId?: string;
  query: string;
  people?: ESearchPeople;
  limit: number;
  cursor?: DateIdCursor;
  findFriendUserIds(userId: string): Promise<string[]>;
}

export interface IFindPostsForSearchOutput extends IPost {
  author: Pick<IUser, 'id' | 'name' | 'email' | 'username' | 'avatar'>;
}
