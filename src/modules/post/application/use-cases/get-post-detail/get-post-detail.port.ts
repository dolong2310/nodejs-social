import { UseCase } from '@/modules/core/application/base.usecase';
import { IPostDetailOutput } from '@/modules/post/domain/repositories/post.query.type';

export class GetPostDetailQuery {
  postId: string;
  viewerUserId?: string;
  constructor(payload: { postId: string; viewerUserId?: string }) {
    this.postId = payload.postId;
    this.viewerUserId = payload.viewerUserId;
  }
}

export abstract class GetPostDetailPort implements UseCase<GetPostDetailQuery, IPostDetailOutput> {
  abstract execute(query: GetPostDetailQuery): Promise<IPostDetailOutput>;
}
