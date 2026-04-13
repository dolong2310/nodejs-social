import { IBookmarkRepository } from '@/domain/repositories/bookmark/bookmark.repository';

import { CreateBookmarkPayloadDTO, DeleteBookmarkPayloadDTO } from '@/application/dtos/bookmark/bookmark.payload.dto';
import { CreateBookmarkResultDTO, DeleteBookmarkResultDTO } from '@/application/dtos/bookmark/bookmark.result.dto';
import { BookmarkPostNotFoundException } from '@/application/errors/bookmark.error';
import { IBookmarksService } from '@/application/ports/bookmark.port';
import { BaseService } from '@/application/use-cases/base.service';

export class BookmarksService extends BaseService implements IBookmarksService {
  constructor(private readonly bookmarkRepository: IBookmarkRepository) {
    super();
  }

  async bookmarkPost({ userId, postId }: CreateBookmarkPayloadDTO): Promise<CreateBookmarkResultDTO> {
    const result = await this.bookmarkRepository.createBookmark({ userId, postId });
    if (!result) {
      throw BookmarkPostNotFoundException;
    }
    return new CreateBookmarkResultDTO(result);
  }

  async unbookmarkPost({ userId, postId }: DeleteBookmarkPayloadDTO): Promise<DeleteBookmarkResultDTO> {
    const result = await this.bookmarkRepository.deleteBookmark({ userId, postId });
    if (!result) {
      throw BookmarkPostNotFoundException;
    }
    return new DeleteBookmarkResultDTO(result);
  }
}
