import { UseCase } from '@/modules/core/application/base.usecase';
import { PostDetailWithAuthorOutput } from '@/modules/post/domain/repositories/post.query.types';

export class GetPostDetailInputPort {
  postId: string;
  currentUserId?: string;
  constructor(payload: { postId: string; currentUserId?: string }) {
    this.postId = payload.postId;
    this.currentUserId = payload.currentUserId;
  }
}

export abstract class GetPostDetailPort implements UseCase<GetPostDetailInputPort, PostDetailWithAuthorOutput> {
  abstract execute(input: GetPostDetailInputPort): Promise<PostDetailWithAuthorOutput>;
}
