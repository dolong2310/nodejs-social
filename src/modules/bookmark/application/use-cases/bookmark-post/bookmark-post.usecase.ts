import { PostNotFoundException } from '@/modules/post/application/post.exception';
import { PostQueryRepositoryPort } from '@/modules/post/application/ports/queries/post-query.repository';
import { PostAudienceAccessServicePort } from '@/modules/post/application/services/post-audience-access.service';
import {
  BookmarkPostCommand,
  BookmarkPostPort,
  BookmarkPostResult
} from '@/modules/bookmark/application/use-cases/bookmark-post/bookmark-post.port';
import { BookmarkRepositoryPort } from '@/modules/bookmark/domain/repositories/bookmark.repository';

export class BookmarkPostUseCase extends BookmarkPostPort {
  constructor(
    private readonly bookmarkRepository: BookmarkRepositoryPort,
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postAudienceAccess: PostAudienceAccessServicePort
  ) {
    super();
  }

  async execute({ userId, postId }: BookmarkPostCommand): Promise<BookmarkPostResult> {
    const post = await this.postQueryRepository.findPostDetailById(postId);
    if (!post) {
      throw new PostNotFoundException();
    }
    await this.postAudienceAccess.assertViewerCanAccessPostDetail(post, userId);

    const bookmarkEntity = await this.bookmarkRepository.createBookmark({ userId, postId });
    if (!bookmarkEntity) {
      throw new PostNotFoundException();
    }
    return new BookmarkPostResult(bookmarkEntity.toObject());
  }
}
