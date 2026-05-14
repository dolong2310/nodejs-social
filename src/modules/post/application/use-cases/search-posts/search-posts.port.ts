import { EnumSearchPeople, EnumSearchType } from '@/modules/common/domain/enums/search.enum';
import { UseCase } from '@/modules/core/application/base.usecase';
import { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.type';

export class SearchPostsQuery {
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

export class SearchPostsResult<T extends PostDetailWithAuthorOutput> {
  items: T[];
  nextCursor: string | null;
  constructor(payload: { items: T[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export abstract class SearchPostsPort implements UseCase<
  SearchPostsQuery,
  SearchPostsResult<PostDetailWithAuthorOutput>
> {
  abstract execute<T extends PostDetailWithAuthorOutput>(query: SearchPostsQuery): Promise<SearchPostsResult<T>>;
}
