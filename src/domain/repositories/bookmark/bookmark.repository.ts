import { IBookmark } from '@/domain/entities/bookmark.entity';
import { ICreateBookmarkInput, IDeleteBookmarkInput } from '@/domain/repositories/bookmark/bookmark.interface';

export interface IBookmarkRepository {
  createBookmark(data: ICreateBookmarkInput): Promise<IBookmark | null>;
  deleteBookmark(data: IDeleteBookmarkInput): Promise<IBookmark | null>;
}
