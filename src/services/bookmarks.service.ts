import { ICreateBookmarkRequestBody, IDeleteBookmarkRequestParams } from '@/models/requests/bookmark.request';
import { ICreateBookmarkResponse, IDeleteBookmarkResponse } from '@/models/responses/bookmark.response';
import { IBookmark } from '@/models/schemas/bookmark.schema';
import { IBookmarkRepository } from '@/repositories/bookmark.repository';
import { BaseService } from '@/services/base.service';

export interface IBookmarksService {
  bookmarkPost({
    userId,
    postId
  }: ICreateBookmarkRequestBody & { userId: string }): Promise<ICreateBookmarkResponse | null>;
  unbookmarkPost({
    userId,
    postId
  }: IDeleteBookmarkRequestParams & { userId: string }): Promise<IDeleteBookmarkResponse | null>;
}

class BookmarksService extends BaseService implements IBookmarksService {
  constructor(private readonly bookmarkRepository: IBookmarkRepository) {
    super();
  }

  async bookmarkPost({
    userId,
    postId
  }: ICreateBookmarkRequestBody & { userId: string }): Promise<ICreateBookmarkResponse | null> {
    const result = await this.bookmarkRepository.findOneAndUpdate({ userId, postId });
    return this.replaceObjectIdToString<ICreateBookmarkResponse>(result);
  }

  async unbookmarkPost({
    userId,
    postId
  }: IDeleteBookmarkRequestParams & { userId: string }): Promise<IDeleteBookmarkResponse | null> {
    const result = await this.bookmarkRepository.findOneAndDelete({ userId, postId });
    return this.replaceObjectIdToString<IDeleteBookmarkResponse>(result);
  }
}

export default BookmarksService;
