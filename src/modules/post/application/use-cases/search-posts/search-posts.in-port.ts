import { IPostDetailWithAuthorOutput } from '@/modules/post/application/ports/queries/post-query.type';
import { UseCase } from '@/modules/core/application/base.usecase';
import { ESearchPeople, ESearchType } from '@/modules/common/domain/enums/search.enum';

export class SearchPostsQuery {
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

export class SearchPostsResult<T extends IPostDetailWithAuthorOutput> {
  items: T[];
  nextCursor: string | null;
  constructor(payload: { items: T[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export abstract class SearchPostsInPort implements UseCase<
  SearchPostsQuery,
  SearchPostsResult<IPostDetailWithAuthorOutput>
> {
  abstract execute<T extends IPostDetailWithAuthorOutput>(query: SearchPostsQuery): Promise<SearchPostsResult<T>>;
}
