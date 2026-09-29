import { UseCase } from '@/modules/core/application/base.usecase';
import { EnumPostType } from '@/modules/post/domain/entities/post.type';
import { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.type';

export class GetPostsTypeInputPort {
  userId?: string;
  postId: string;
  type: EnumPostType;
  limit: number;
  cursor?: string;
  constructor(payload: { userId?: string; postId: string; type: EnumPostType; limit: string; cursor?: string }) {
    this.userId = payload.userId;
    this.postId = payload.postId;
    this.type = payload.type;
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
  }
}

export class GetPostsTypeOutputPort<T extends PostDetailWithAuthorOutput> {
  items: T[];
  nextCursor: string | null;
  constructor(payload: { items: T[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export abstract class GetPostsTypePort implements UseCase<
  GetPostsTypeInputPort,
  GetPostsTypeOutputPort<PostDetailWithAuthorOutput>
> {
  abstract execute<T extends PostDetailWithAuthorOutput>(
    input: GetPostsTypeInputPort
  ): Promise<GetPostsTypeOutputPort<T>>;
}
