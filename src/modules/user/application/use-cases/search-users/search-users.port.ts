import type { EnumSearchPeople, EnumSearchType } from '@/modules/common/domain/enums/search.enum';
import type { UseCase } from '@/modules/core/application/base.usecase';
import type { UserSafeProps } from '@/modules/user/domain/entities/user.types';

export class SearchUsersInputPort {
  userId?: string;
  query?: string;
  type?: EnumSearchType;
  people?: EnumSearchPeople;
  limit: number;
  cursor?: string;
  constructor(payload: {
    userId?: string;
    query?: string;
    type?: EnumSearchType;
    people?: EnumSearchPeople;
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

export class SearchUsersOutputPort {
  items: UserSafeProps[];
  nextCursor: string | null;
  constructor(payload: { items: UserSafeProps[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export abstract class SearchUsersPort implements UseCase<SearchUsersInputPort, SearchUsersOutputPort> {
  abstract execute(input: SearchUsersInputPort): Promise<SearchUsersOutputPort>;
}
