import { Injectable } from '@/decorators/injectable.decorator';
import { BaseService } from '@/modules/base/base.service';
import { BookmarkRepository } from '@/modules/bookmarks/bookmarks.repository';
import { CreateBookmarkRequestDTO, DeleteBookmarkParamsDTO } from '@/modules/bookmarks/dtos/bookmarks.request.dto';
import { CreateBookmarkResponseDTO, DeleteBookmarkResponseDTO } from '@/modules/bookmarks/dtos/bookmarks.response.dto';

export interface IBookmarksService {
  bookmarkPost(payload: CreateBookmarkRequestDTO & { userId: string }): Promise<CreateBookmarkResponseDTO | null>;
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
  }: CreateBookmarkRequestDTO & { userId: string }): Promise<CreateBookmarkResponseDTO | null> {
    const result = await this.bookmarkRepository.findOneAndUpdate({ userId, postId });
    return result ? new CreateBookmarkResponseDTO(result) : null;
  }

  async unbookmarkPost({
    userId,
    postId
  }: DeleteBookmarkParamsDTO & { userId: string }): Promise<DeleteBookmarkResponseDTO | null> {
    const result = await this.bookmarkRepository.findOneAndDelete({ userId, postId });
    return result ? new DeleteBookmarkResponseDTO(result) : null;
  }
}
