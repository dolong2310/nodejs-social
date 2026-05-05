import { PostNotFoundException } from '@/modules/post/application/post.exception';
import { PostQueryRepositoryPort } from '@/modules/post/application/ports/queries/post-query.repository';
import { PostAudienceAccessServicePort } from '@/modules/post/application/services/post-audience-access.service';
import {
  UnbookmarkPostCommand,
  UnbookmarkPostInPort,
  UnbookmarkPostResult
} from '@/modules/bookmark/application/use-cases/unbookmark-post/unbookmark-post.in-port';
import { BookmarkRepositoryPort } from '@/modules/bookmark/domain/repositories/bookmark.repository';

export class UnbookmarkPostInteractor extends UnbookmarkPostInPort {
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
