import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { BookmarkEntity } from '@/modules/post/domain/entities/bookmark.entity';
import { CreateBookmarkInput, DeleteBookmarkInput } from '@/modules/post/domain/repositories/bookmark.repository.type';

export interface BookmarkRepositoryPort extends RepositoryPort<BookmarkEntity> {
  createBookmark(data: CreateBookmarkInput): Promise<BookmarkEntity | null>;
  deleteBookmark(data: DeleteBookmarkInput): Promise<BookmarkEntity | null>;
}
