import { UseCase } from '@/modules/core/application/base.usecase';
import { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.type';

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

export class GetNewFeedsResult<T extends PostDetailWithAuthorOutput> {
  items: T[];
  nextCursor: string | null;
  constructor(payload: { items: T[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export abstract class GetNewFeedsPort implements UseCase<
  GetNewFeedsQuery,
  GetNewFeedsResult<PostDetailWithAuthorOutput>
> {
  abstract execute<T extends PostDetailWithAuthorOutput>(query: GetNewFeedsQuery): Promise<GetNewFeedsResult<T>>;
}
