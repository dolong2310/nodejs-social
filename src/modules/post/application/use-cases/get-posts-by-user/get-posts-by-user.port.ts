import { UseCase } from '@/modules/core/application/base.usecase';
import { EnumPostType } from '@/modules/post/domain/entities/post.type';
import { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.type';

export class GetPostsByUserInputPort {
  targetUserId: string;
  currentUserId?: string;
  type?: EnumPostType;
  limit: number;
  cursor?: string;

  constructor(payload: {
    targetUserId: string;
    currentUserId?: string;
    type?: EnumPostType;
    limit: string;
    cursor?: string;
  }) {
    this.targetUserId = payload.targetUserId;
    this.currentUserId = payload.currentUserId;
    this.type = payload.type;
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
  }
}

export class GetPostsByUserOutputPort<T extends PostDetailWithAuthorOutput> {
  items: T[];
  nextCursor: string | null;

  constructor(payload: { items: T[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export abstract class GetPostsByUserPort implements UseCase<
  GetPostsByUserInputPort,
  GetPostsByUserOutputPort<PostDetailWithAuthorOutput>
> {
  abstract execute<T extends PostDetailWithAuthorOutput>(
    input: GetPostsByUserInputPort
  ): Promise<GetPostsByUserOutputPort<T>>;
}
