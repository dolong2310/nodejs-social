import { UseCase } from '@/modules/core/application/base.usecase';
import { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.type';

export class GetGuestNewFeedsInputPort {
  limit: number;
  cursor?: string;
  constructor(payload: { limit: string; cursor?: string }) {
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
  }
}

export class GetGuestNewFeedsOutputPort<T extends PostDetailWithAuthorOutput> {
  items: T[];
  nextCursor: string | null;
  constructor(payload: { items: T[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export abstract class GetGuestNewFeedsPort implements UseCase<
  GetGuestNewFeedsInputPort,
  GetGuestNewFeedsOutputPort<PostDetailWithAuthorOutput>
> {
  abstract execute<T extends PostDetailWithAuthorOutput>(
    input: GetGuestNewFeedsInputPort
  ): Promise<GetGuestNewFeedsOutputPort<T>>;
}
