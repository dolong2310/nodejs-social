import { UseCase } from '@/modules/core/application/base.usecase';
import { EnumNewFeedFilter } from '@/modules/post/domain/entities/post.types';
import { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.types';

export class GetNewFeedsInputPort {
  userId: string;
  limit: number;
  cursor?: string;
  filter: EnumNewFeedFilter;
  constructor(payload: { userId: string; limit: string; cursor?: string; filter?: EnumNewFeedFilter }) {
    this.userId = payload.userId;
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
    this.filter = payload.filter ?? EnumNewFeedFilter.FOR_YOU;
  }
}

export class GetNewFeedsOutputPort<T extends PostDetailWithAuthorOutput> {
  items: T[];
  nextCursor: string | null;
  constructor(payload: { items: T[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export abstract class GetNewFeedsPort implements UseCase<
  GetNewFeedsInputPort,
  GetNewFeedsOutputPort<PostDetailWithAuthorOutput>
> {
  abstract execute<T extends PostDetailWithAuthorOutput>(
    input: GetNewFeedsInputPort
  ): Promise<GetNewFeedsOutputPort<T>>;
}
