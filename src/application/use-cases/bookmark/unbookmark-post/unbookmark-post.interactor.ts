import { PostNotFoundException } from '@/application/exceptions/post.exception';
import {
  UnbookmarkPostCommand,
  UnbookmarkPostInPort,
  UnbookmarkPostResult
} from '@/application/use-cases/bookmark/unbookmark-post/unbookmark-post.in-port';
import { BookmarkRepositoryPort } from '@/domain/repositories/bookmark/bookmark.repository';

export class UnbookmarkPostInteractor extends UnbookmarkPostInPort {
  constructor(private readonly bookmarkRepository: BookmarkRepositoryPort) {
    super();
  }

  async execute({ userId, postId }: UnbookmarkPostCommand): Promise<UnbookmarkPostResult> {
    const bookmarkEntity = await this.bookmarkRepository.deleteBookmark({ userId, postId });
    if (!bookmarkEntity) {
      throw PostNotFoundException;
    }
    return new UnbookmarkPostResult(bookmarkEntity.toObject());
  }
}
