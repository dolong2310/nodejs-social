import { RepositoryPort } from '@/modules/core/domain/repositories/port.repository';
import { BookmarkEntity } from '@/modules/post/domain/entities/bookmark.entity';
import {
  ICreateBookmarkInput,
  IDeleteBookmarkInput
} from '@/modules/post/domain/repositories/bookmark.repository.type';

export interface BookmarkRepositoryPort extends RepositoryPort<BookmarkEntity> {
  createBookmark(data: ICreateBookmarkInput): Promise<BookmarkEntity | null>;
  deleteBookmark(data: IDeleteBookmarkInput): Promise<BookmarkEntity | null>;
}
