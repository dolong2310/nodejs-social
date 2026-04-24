import { IPostDetailWithAuthorOutput } from '@/application/queries/post/post-query.type';
import { UseCase } from '@/application/use-cases/base/base.usecase';

export class GetGuestNewFeedsQuery {
  limit: number;
  cursor?: string;
  constructor(payload: { limit: string; cursor?: string }) {
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
  }
}

export class GetGuestNewFeedsResult<T extends IPostDetailWithAuthorOutput> {
  items: T[];
  nextCursor: string | null;
  constructor(payload: { items: T[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export abstract class GetGuestNewFeedsInPort implements UseCase<
  GetGuestNewFeedsQuery,
  GetGuestNewFeedsResult<IPostDetailWithAuthorOutput>
> {
  abstract execute<T extends IPostDetailWithAuthorOutput>(
    query: GetGuestNewFeedsQuery
  ): Promise<GetGuestNewFeedsResult<T>>;
}
