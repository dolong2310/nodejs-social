import { BookmarkEntity } from '@/modules/bookmark/domain/entities/bookmark.entity';
import {
  ICreateBookmarkInput,
  IDeleteBookmarkInput
} from '@/modules/bookmark/domain/repositories/bookmark.repository.type';
import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';

export interface BookmarkRepositoryPort extends RepositoryPort<BookmarkEntity> {
  createBookmark(data: ICreateBookmarkInput): Promise<BookmarkEntity | null>;
  deleteBookmark(data: IDeleteBookmarkInput): Promise<BookmarkEntity | null>;
}
