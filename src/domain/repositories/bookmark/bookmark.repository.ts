import { BookmarkEntity } from '@/domain/entities/bookmark/bookmark.entity';
import { RepositoryPort } from '@/domain/repositories/base/port.repository';
import { ICreateBookmarkInput, IDeleteBookmarkInput } from '@/domain/repositories/bookmark/bookmark.repository.type';

export interface BookmarkRepositoryPort extends RepositoryPort<BookmarkEntity> {
  createBookmark(data: ICreateBookmarkInput): Promise<BookmarkEntity | null>;
  deleteBookmark(data: IDeleteBookmarkInput): Promise<BookmarkEntity | null>;
}
