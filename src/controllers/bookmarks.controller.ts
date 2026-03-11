import HTTP_STATUS from '@/constants/httpStatus.constant';
import { ICreateBookmarkRequestBody, IDeleteBookmarkRequestParams } from '@/models/requests/bookmark.request';
import bookmarksService from '@/services/bookmarks.service';
import { AccessTokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

class BookmarksController {
  constructor() {}

  async createBookmark(req: Request<{}, {}, ICreateBookmarkRequestBody>, res: Response) {
    const { userId } = req.accessTokenPayload as AccessTokenPayload;
    const { postId } = req.body;

    const bookmark = await bookmarksService.bookmarkPost({
      userId,
      postId
    });

    return res.status(HTTP_STATUS.CREATED).json({ data: bookmark, message: 'Bookmark post successfully' });
  }

  async deleteBookmark(req: Request<IDeleteBookmarkRequestParams>, res: Response) {
    const { userId } = req.accessTokenPayload as AccessTokenPayload;
    const { postId } = req.params;

    await bookmarksService.unbookmarkPost({
      userId,
      postId
    });

    return res.status(HTTP_STATUS.OK).json({ message: 'Unbookmark post successfully' });
  }
}

export default new BookmarksController();
