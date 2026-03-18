import { IBookmark } from '@/models/schemas/bookmark.schema';
import { IBookmarkRepository } from '@/repositories/bookmark.repository';

export interface IBookmarksService {
  bookmarkPost({ userId, postId }: { userId: string; postId: string }): Promise<IBookmark | null>;
  unbookmarkPost({ userId, postId }: { userId: string; postId: string }): Promise<IBookmark | null>;
}

class BookmarksService implements IBookmarksService {
  constructor(private readonly bookmarkRepository: IBookmarkRepository) {}

  bookmarkPost({ userId, postId }: { userId: string; postId: string }): Promise<IBookmark | null> {
    return this.bookmarkRepository.findOneAndUpdate({ userId, postId });
  }

  unbookmarkPost({ userId, postId }: { userId: string; postId: string }): Promise<IBookmark | null> {
    return this.bookmarkRepository.findOneAndDelete({ userId, postId });
  }
}

export default BookmarksService;
