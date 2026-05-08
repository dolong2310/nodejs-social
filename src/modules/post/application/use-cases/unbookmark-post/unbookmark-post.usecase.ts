import { PostNotFoundException } from '@/modules/post/application/exceptions/post.exception';
import { PostAudienceAccessServicePort } from '@/modules/post/application/services/post-audience-access.service';
import {
  UnbookmarkPostCommand,
  UnbookmarkPostPort,
  UnbookmarkPostResult
} from '@/modules/post/application/use-cases/unbookmark-post/unbookmark-post.port';
import { BookmarkRepositoryPort } from '@/modules/post/domain/repositories/bookmark.repository';
import { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';

export class UnbookmarkPostUseCase extends UnbookmarkPostPort {
  constructor(
    private readonly bookmarkRepository: BookmarkRepositoryPort,
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postAudienceAccess: PostAudienceAccessServicePort
  ) {
    super();
  }

  async execute({ userId, postId }: UnbookmarkPostCommand): Promise<UnbookmarkPostResult> {
    const post = await this.postQueryRepository.findPostDetailById(postId);
    if (!post) {
      throw new PostNotFoundException();
    }
    await this.postAudienceAccess.assertViewerCanAccessPostDetail(post, userId);

    const bookmarkEntity = await this.bookmarkRepository.deleteBookmark({ userId, postId });
    if (!bookmarkEntity) {
      throw new PostNotFoundException();
    }
    return new UnbookmarkPostResult(bookmarkEntity.toObject());
  }
}
