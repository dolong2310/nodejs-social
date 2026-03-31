import { Injectable } from '@/decorators';
import {
  BaseService,
  BookmarkRepository,
  CreateBookmarkRequestDTO,
  CreateBookmarkResponseDTO,
  DeleteBookmarkParamsDTO,
  DeleteBookmarkResponseDTO
} from '@/modules';

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
