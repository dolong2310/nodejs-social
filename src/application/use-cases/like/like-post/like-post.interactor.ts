import { PostNotFoundException } from '@/application/exceptions/post.exception';
import {
  CreateLikeCommand,
  CreateLikeInPort,
  CreateLikeResult
} from '@/application/use-cases/like/like-post/like-post.in-port';
import { LikeRepositoryPort } from '@/domain/repositories/like/like.repository';

export class LikePostInteractor extends CreateLikeInPort {
  constructor(private readonly likeRepository: LikeRepositoryPort) {
    super();
  }

  async execute({ userId, postId }: CreateLikeCommand): Promise<CreateLikeResult> {
    const likeEntity = await this.likeRepository.createLike({ userId, postId });
    const like = likeEntity?.toObject();
    if (!like) {
      throw PostNotFoundException;
    }
    return new CreateLikeResult(like);
  }
}
