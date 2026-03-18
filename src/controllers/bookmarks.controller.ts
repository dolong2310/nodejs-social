import { BaseController } from '@/controllers/base.controller';
import { ICreateBookmarkRequestBody, IDeleteBookmarkRequestParams } from '@/models/requests/bookmark.request';
import { Created, OK } from '@/responses/success.response';
import { IBookmarksService } from '@/services/bookmarks.service';
import { TokenPayload } from '@/types/token.type';
import { Request, Response } from 'express';

export interface IBookmarksController {
  createBookmark(req: Request<{}, {}, ICreateBookmarkRequestBody>, res: Response): Promise<void>;
  deleteBookmark(req: Request<IDeleteBookmarkRequestParams>, res: Response): Promise<void>;
}

class BookmarksController extends BaseController implements IBookmarksController {
  constructor(private readonly bookmarksService: IBookmarksService) {
    super();
  }

  async createBookmark(req: Request<{}, {}, ICreateBookmarkRequestBody>, res: Response) {
    const { userId } = req.tokenPayload as TokenPayload;
    const { postId } = req.body;

    const bookmark = await this.bookmarksService.bookmarkPost({
      userId,
      postId
    });

    new Created({
      data: bookmark,
      message: 'Bookmark post successfully'
    }).send(res);
  }

  async deleteBookmark(req: Request<IDeleteBookmarkRequestParams>, res: Response) {
    const { userId } = req.tokenPayload as TokenPayload;
    const { postId } = req.params;

    await this.bookmarksService.unbookmarkPost({
      userId,
      postId
    });

    new OK({
      message: 'Unbookmark post successfully'
    }).send(res);
  }
}

export default BookmarksController;
