import { PostNotFoundException } from '@/application/exceptions/post.exception';
import {
  BookmarkPostCommand,
  BookmarkPostInPort,
  BookmarkPostResult
} from '@/application/use-cases/bookmark/bookmark-post/bookmark-post.in-port';
import { BookmarkRepositoryPort } from '@/domain/repositories/bookmark/bookmark.repository';

export class BookmarkPostInteractor extends BookmarkPostInPort {
  constructor(private readonly bookmarkRepository: BookmarkRepositoryPort) {
    super();
  }

  async execute({ userId, postId }: BookmarkPostCommand): Promise<BookmarkPostResult> {
    const bookmarkEntity = await this.bookmarkRepository.createBookmark({ userId, postId });
    if (!bookmarkEntity) {
      throw PostNotFoundException;
    }
    return new BookmarkPostResult(bookmarkEntity.toObject());
  }
}
