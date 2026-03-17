import { ICreateBookmarkRequestBody, IDeleteBookmarkRequestParams } from '@/models/requests/bookmark.request';
import { Created, OK } from '@/models/success.response';
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

    return new Created({
      data: bookmark,
      message: 'Bookmark post successfully'
    }).send(res);
  }

  async deleteBookmark(req: Request<IDeleteBookmarkRequestParams>, res: Response) {
    const { userId } = req.accessTokenPayload as AccessTokenPayload;
    const { postId } = req.params;

    await bookmarksService.unbookmarkPost({
      userId,
      postId
    });

    return new OK({
      message: 'Unbookmark post successfully'
    }).send(res);
  }
}

export default new BookmarksController();
