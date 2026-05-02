import { IPostDetailOutput } from '@/modules/post/application/ports/queries/post-query.type';
import { UseCase } from '@/modules/core/application/base.usecase';

export class GetPostDetailQuery {
  postId: string;
  viewerUserId?: string;
  constructor(payload: { postId: string; viewerUserId?: string }) {
    this.postId = payload.postId;
    this.viewerUserId = payload.viewerUserId;
  }
}

export abstract class GetPostDetailInPort implements UseCase<GetPostDetailQuery, IPostDetailOutput> {
  abstract execute(query: GetPostDetailQuery): Promise<IPostDetailOutput>;
}
