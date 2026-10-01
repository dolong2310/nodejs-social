import type { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import type { BookmarkEntity } from '@/modules/post/domain/entities/bookmark.entity';
import type {
  CreateBookmarkInput,
  DeleteBookmarkInput
} from '@/modules/post/domain/repositories/bookmark.repository.types';

export interface BookmarkRepositoryPort extends RepositoryPort<BookmarkEntity> {
  createBookmark(data: CreateBookmarkInput): Promise<BookmarkEntity | null>;
  deleteBookmark(data: DeleteBookmarkInput): Promise<BookmarkEntity | null>;
}
