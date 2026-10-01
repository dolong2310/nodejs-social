import { PostNotFoundException } from '@/modules/post/application/exceptions/post.exception';
import type { PostAudienceAccessServicePort } from '@/modules/post/application/services/post-audience-access.service';
import {
  type CreateLikeInputPort,
  CreateLikePort,
  CreateLikeOutputPort
} from '@/modules/post/application/use-cases/like-post/like-post.port';
import type { LikeRepositoryPort } from '@/modules/post/domain/repositories/like.repository';
import type { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';

export class LikePostUseCase extends CreateLikePort {
  constructor(
    private readonly likeRepository: LikeRepositoryPort,
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postAudienceAccess: PostAudienceAccessServicePort
  ) {
    super();
  }

  async execute(input: CreateLikeInputPort): Promise<CreateLikeOutputPort> {
    const { userId, postId } = input;
    const post = await this.postQueryRepository.findPostDetailById(postId);
    if (!post) {
      throw new PostNotFoundException();
    }
    await this.postAudienceAccess.assertUserCanAccessPostDetail(post, userId);

    const likeEntity = await this.likeRepository.createLike({ userId, postId });
    const like = likeEntity?.toObject();
    if (!like) {
      throw new PostNotFoundException();
    }
    return new CreateLikeOutputPort(like);
  }
}
