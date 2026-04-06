import { Injectable } from '@/decorators/injectable.decorator';
import { BaseService } from '@/modules/base/base.service';
import { BookmarkPostNotFoundException } from '@/modules/bookmarks/bookmarks.exception';
import { BookmarkRepository } from '@/modules/bookmarks/bookmarks.repository';
import { CreateBookmarkRequestDTO, DeleteBookmarkParamsDTO } from '@/modules/bookmarks/dtos/bookmarks.request.dto';
import { CreateBookmarkResponseDTO, DeleteBookmarkResponseDTO } from '@/modules/bookmarks/dtos/bookmarks.response.dto';

export interface IBookmarksService {
  bookmarkPost(payload: CreateBookmarkRequestDTO & { userId: string }): Promise<CreateBookmarkResponseDTO>;
  unbookmarkPost(payload: DeleteBookmarkParamsDTO & { userId: string }): Promise<DeleteBookmarkResponseDTO | null>;
}

@Injectable()
export class BookmarksService extends BaseService implements IBookmarksService {
  constructor(private readonly bookmarkRepository: BookmarkRepository) {
    super();
  }

  async bookmarkPost({
    userId,
    postId
  }: CreateBookmarkRequestDTO & { userId: string }): Promise<CreateBookmarkResponseDTO> {
    const result = await this.bookmarkRepository.findOneAndUpdate({ userId, postId });

    if (!result) {
      throw BookmarkPostNotFoundException;
    }

    return new CreateBookmarkResponseDTO(result);
  }

  async unbookmarkPost({
    userId,
    postId
  }: DeleteBookmarkParamsDTO & { userId: string }): Promise<DeleteBookmarkResponseDTO | null> {
    const result = await this.bookmarkRepository.findOneAndDelete({ userId, postId });
    return result ? new DeleteBookmarkResponseDTO(result) : null;
  }
}
