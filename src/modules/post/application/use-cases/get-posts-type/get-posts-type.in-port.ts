import { IPostDetailOutput } from '@/modules/post/application/ports/queries/post-query.type';
import { UseCase } from '@/modules/core/application/base.usecase';
import { EPostType } from '@/modules/post/domain/entities/post.type';

export class GetPostsTypeQuery {
  userId?: string;
  postId: string;
  type: EPostType;
  limit: number;
  cursor?: string;
  constructor(payload: { userId?: string; postId: string; type: EPostType; limit: string; cursor?: string }) {
    this.userId = payload.userId;
    this.postId = payload.postId;
    this.type = payload.type;
    this.limit = Number(payload.limit);
    this.cursor = payload.cursor;
  }
}

export class GetPostsTypeResult<T extends IPostDetailOutput> {
  items: T[];
  nextCursor: string | null;
  constructor(payload: { items: T[]; nextCursor: string | null }) {
    this.items = payload.items;
    this.nextCursor = payload.nextCursor;
  }
}

export abstract class GetPostsTypeInPort implements UseCase<GetPostsTypeQuery, GetPostsTypeResult<IPostDetailOutput>> {
  abstract execute<T extends IPostDetailOutput>(query: GetPostsTypeQuery): Promise<GetPostsTypeResult<T>>;
}
