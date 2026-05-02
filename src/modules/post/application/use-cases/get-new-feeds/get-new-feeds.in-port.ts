import { IPostDetailWithAuthorOutput } from '@/modules/post/application/ports/queries/post-query.type';
import { UseCase } from '@/modules/core/application/base.usecase';

export class GetNewFeedsQuery {
  userId: string;
  limit: number;
  cursor?: string;
  constructor(payload: { userId: string; limit: string; cursor?: string }) {
    this.userId = payload.userId;
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
  }
}

export class GetNewFeedsResult<T extends IPostDetailWithAuthorOutput> {
  items: T[];
  nextCursor: string | null;
  constructor(payload: { items: T[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export abstract class GetNewFeedsInPort implements UseCase<
  GetNewFeedsQuery,
  GetNewFeedsResult<IPostDetailWithAuthorOutput>
> {
  abstract execute<T extends IPostDetailWithAuthorOutput>(query: GetNewFeedsQuery): Promise<GetNewFeedsResult<T>>;
}
