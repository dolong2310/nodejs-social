import { CreateBookmarkRequestDTO, DeleteBookmarkParamsDTO } from '@/dtos/requests/bookmark.request.dto';
import { CreateBookmarkResponseDTO, DeleteBookmarkResponseDTO } from '@/dtos/responses/bookmark.response.dto';
import { IBookmarkRepository } from '@/repositories/bookmark.repository';
import { BaseService } from '@/services/base.service';

export interface IBookmarksService {
  bookmarkPost(payload: CreateBookmarkRequestDTO & { userId: string }): Promise<CreateBookmarkResponseDTO | null>;
  unbookmarkPost(payload: DeleteBookmarkParamsDTO & { userId: string }): Promise<DeleteBookmarkResponseDTO | null>;
}

class BookmarksService extends BaseService implements IBookmarksService {
  constructor(private readonly bookmarkRepository: IBookmarkRepository) {
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

export default BookmarksService;
