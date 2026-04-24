import { PostNotFoundException } from '@/application/exceptions/post.exception';
import {
  UnlikeCommand,
  UnlikeInPort,
  UnlikeResult
} from '@/application/use-cases/like/unlike-post/unlike-post.in-port';
import { LikeRepositoryPort } from '@/domain/repositories/like/like.repository';

export class UnlikePostInteractor extends UnlikeInPort {
  constructor(private readonly likeRepository: LikeRepositoryPort) {
    super();
  }

  async execute({ userId, postId }: UnlikeCommand): Promise<UnlikeResult> {
    const likeEntity = await this.likeRepository.deleteLike({ userId, postId });
    const like = likeEntity?.toObject();
    if (!like) {
      throw PostNotFoundException;
    }
    return new UnlikeResult(like);
  }
}
