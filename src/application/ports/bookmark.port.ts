import { CreateBookmarkPayloadDTO, DeleteBookmarkPayloadDTO } from '@/application/dtos/bookmark/bookmark.payload.dto';
import { CreateBookmarkResultDTO, DeleteBookmarkResultDTO } from '@/application/dtos/bookmark/bookmark.result.dto';

export interface IBookmarksService {
  bookmarkPost(payload: CreateBookmarkPayloadDTO): Promise<CreateBookmarkResultDTO>;
  unbookmarkPost(payload: DeleteBookmarkPayloadDTO): Promise<DeleteBookmarkResultDTO>;
}
