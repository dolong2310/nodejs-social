import { UseCase } from '@/modules/core/application/base.usecase';
import { UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { ESearchPeople, ESearchType } from '@/modules/common/domain/enums/search.enum';

export class SearchUsersQuery {
  userId?: string;
  query?: string;
  type?: ESearchType;
  people?: ESearchPeople;
  limit: number;
  cursor?: string;
  constructor(payload: {
    userId?: string;
    query?: string;
    type?: ESearchType;
    people?: ESearchPeople;
    limit: string;
    cursor?: string;
  }) {
    this.userId = payload.userId;
    this.query = payload.query;
    this.type = payload.type;
    this.people = payload.people;
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
  }
}

export class SearchUsersResult {
  items: UserSafeProps[];
  nextCursor: string | null;
  constructor(payload: { items: UserSafeProps[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export abstract class SearchUsersInPort implements UseCase<SearchUsersQuery, SearchUsersResult> {
  abstract execute(query: SearchUsersQuery): Promise<SearchUsersResult>;
}
