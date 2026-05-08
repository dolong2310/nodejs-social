import { PostNotFoundException } from '@/modules/post/application/exceptions/post.exception';
import { PostAudienceAccessServicePort } from '@/modules/post/application/services/post-audience-access.service';
import {
  CreateLikeCommand,
  CreateLikePort,
  CreateLikeResult
} from '@/modules/post/application/use-cases/like-post/like-post.port';
import { LikeRepositoryPort } from '@/modules/post/domain/repositories/like.repository';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';

export class LikePostUseCase extends CreateLikePort {
  constructor(
    private readonly likeRepository: LikeRepositoryPort,
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postAudienceAccess: PostAudienceAccessServicePort
  ) {
    super();
  }

  async execute({ userId, postId }: CreateLikeCommand): Promise<CreateLikeResult> {
    const post = await this.postQueryRepository.findPostDetailById(postId);
    if (!post) {
      throw new PostNotFoundException();
    }
    await this.postAudienceAccess.assertViewerCanAccessPostDetail(post, userId);

    const likeEntity = await this.likeRepository.createLike({ userId, postId });
    const like = likeEntity?.toObject();
    if (!like) {
      throw new PostNotFoundException();
    }
    return new CreateLikeResult(like);
  }
}
