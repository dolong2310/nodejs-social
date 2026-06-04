import { UseCase } from '@/modules/core/application/base.usecase';
import {
  PostDetailWithAuthorOutput,
  PostUserInteractionType
} from '@/modules/post/domain/repositories/post.query.type';

export class GetPostsByUserInteractionQuery {
  userId: string;
  interaction: PostUserInteractionType;
  limit: number;
  cursor?: string;

  constructor(payload: { userId: string; interaction: PostUserInteractionType; limit: string; cursor?: string }) {
    this.userId = payload.userId;
    this.interaction = payload.interaction;
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
  }
}

export class GetPostsByUserInteractionResult<T extends PostDetailWithAuthorOutput> {
  items: T[];
  nextCursor: string | null;

  constructor(payload: { items: T[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export abstract class GetPostsByUserInteractionPort implements UseCase<
  GetPostsByUserInteractionQuery,
  GetPostsByUserInteractionResult<PostDetailWithAuthorOutput>
> {
  abstract execute<T extends PostDetailWithAuthorOutput>(
    query: GetPostsByUserInteractionQuery
  ): Promise<GetPostsByUserInteractionResult<T>>;
}
