import { PostNotFoundException } from '@/modules/post/application/exceptions/post.exception';
import type { PostAudienceAccessServicePort } from '@/modules/post/application/services/post-audience-access.service';
import {
  GetPostDetailPort,
  type GetPostDetailInputPort
} from '@/modules/post/application/use-cases/get-post-detail/get-post-detail.port';
import type { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';

export class GetPostDetailUseCase extends GetPostDetailPort {
  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postAudienceAccess: PostAudienceAccessServicePort
  ) {
    super();
  }

  async execute(input: GetPostDetailInputPort) {
    const { postId, currentUserId } = input;
    const post = await this.postQueryRepository.findPostDetailById(postId, currentUserId);
    if (!post) {
      throw new PostNotFoundException();
    }
    await this.postAudienceAccess.assertUserCanAccessPostDetail(post, currentUserId);
    return post;
  }
}
