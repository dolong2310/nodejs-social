import {
  BaseService,
  CreateBookmarkRequestDTO,
  CreateBookmarkResponseDTO,
  DeleteBookmarkParamsDTO,
  DeleteBookmarkResponseDTO,
  IBookmarkRepository
} from '@/modules';

export interface IBookmarksService {
  bookmarkPost(payload: CreateBookmarkRequestDTO & { userId: string }): Promise<CreateBookmarkResponseDTO | null>;
  unbookmarkPost(payload: DeleteBookmarkParamsDTO & { userId: string }): Promise<DeleteBookmarkResponseDTO | null>;
}

export class BookmarksService extends BaseService implements IBookmarksService {
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
