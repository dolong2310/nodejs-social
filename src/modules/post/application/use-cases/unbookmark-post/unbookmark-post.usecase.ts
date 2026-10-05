import { PostNotFoundException } from '@/modules/post/application/exceptions/post.exception';
import type { PostAudienceAccessServicePort } from '@/modules/post/application/services/post-audience-access.service';
import {
  type UnbookmarkPostInputPort,
  UnbookmarkPostPort,
  UnbookmarkPostOutputPort
} from '@/modules/post/application/use-cases/unbookmark-post/unbookmark-post.port';
import type { BookmarkRepositoryPort } from '@/modules/post/domain/repositories/bookmark.repository';
import type { PostQueryRepositoryPort } from '@/modules/post/domain/repositories/post.query.repository';

export class UnbookmarkPostUseCase extends UnbookmarkPostPort {
  constructor(
    private readonly bookmarkRepository: BookmarkRepositoryPort,
    private readonly postQueryRepository: PostQueryRepositoryPort,
    private readonly postAudienceAccess: PostAudienceAccessServicePort
  ) {
    super();
  }

  async execute(input: UnbookmarkPostInputPort): Promise<UnbookmarkPostOutputPort> {
    const { userId, postId } = input;
    const post = await this.postQueryRepository.findPostDetailById(postId);
    if (!post) {
      throw new PostNotFoundException();
    }
    await this.postAudienceAccess.assertUserCanAccessPostDetail(post, userId);

    const bookmarkEntity = await this.bookmarkRepository.deleteBookmark({ userId, postId });
    if (!bookmarkEntity) {
      throw new PostNotFoundException();
    }
    return new UnbookmarkPostOutputPort(bookmarkEntity.toObject());
  }
}
