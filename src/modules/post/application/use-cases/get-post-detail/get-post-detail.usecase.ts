import { PostNotFoundException } from '@/modules/post/application/exceptions/post.exception';
import { PostAudienceAccessServicePort } from '@/modules/post/application/services/post-audience-access.service';
import {
  GetPostDetailPort,
  GetPostDetailQuery
} from '@/modules/post/application/use-cases/get-post-detail/get-post-detail.port';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';

export class GetPostDetailUseCase extends GetPostDetailPort {
  constructor(
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postAudienceAccess: PostAudienceAccessServicePort
  ) {
    super();
  }

  async execute({ postId, viewerUserId }: GetPostDetailQuery) {
    const post = await this.postQueryRepository.findPostDetailById(postId);
    if (!post) {
      throw new PostNotFoundException();
    }
    await this.postAudienceAccess.assertViewerCanAccessPostDetail(post, viewerUserId);
    return post;
  }
}
