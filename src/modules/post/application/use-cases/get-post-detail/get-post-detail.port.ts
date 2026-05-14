import { UseCase } from '@/modules/core/application/base.usecase';
import { PostDetailOutput } from '@/modules/post/domain/repositories/post.query.type';

export class GetPostDetailQuery {
  postId: string;
  viewerUserId?: string;
  constructor(payload: { postId: string; viewerUserId?: string }) {
    this.postId = payload.postId;
    this.viewerUserId = payload.viewerUserId;
  }
}

export abstract class GetPostDetailPort implements UseCase<GetPostDetailQuery, PostDetailOutput> {
  abstract execute(query: GetPostDetailQuery): Promise<PostDetailOutput>;
}
