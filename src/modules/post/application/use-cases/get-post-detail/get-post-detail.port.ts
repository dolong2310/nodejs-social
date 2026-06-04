import { UseCase } from '@/modules/core/application/base.usecase';
import { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.type';

export class GetPostDetailQuery {
  postId: string;
  currentUserId?: string;
  constructor(payload: { postId: string; currentUserId?: string }) {
    this.postId = payload.postId;
    this.currentUserId = payload.currentUserId;
  }
}

export abstract class GetPostDetailPort implements UseCase<GetPostDetailQuery, PostDetailWithAuthorOutput> {
  abstract execute(query: GetPostDetailQuery): Promise<PostDetailWithAuthorOutput>;
}
