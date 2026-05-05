import { PostNotFoundException } from '@/modules/post/application/post.exception';
import { PostQueryRepositoryPort } from '@/modules/post/application/ports/queries/post-query.repository';
import { PostAudienceAccessServicePort } from '@/modules/post/application/services/post-audience-access.service';
import {
  GetPostDetailPort,
  GetPostDetailQuery
} from '@/modules/post/application/use-cases/get-post-detail/get-post-detail.port';

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
