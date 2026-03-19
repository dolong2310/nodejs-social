import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BaseController } from '@/controllers/base.controller';
import { ICreateBookmarkRequestBody, IDeleteBookmarkRequestParams } from '@/models/requests/bookmark.request';
import { ICreateBookmarkResponse, IDeleteBookmarkResponse } from '@/models/responses/bookmark.response';
import { BadRequestError } from '@/responses/error.response';
import { Created } from '@/responses/success.response';
import { IBookmarksService } from '@/services/bookmarks.service';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IBookmarksController {
  createBookmark(req: Request<ParamsDictionary, object, ICreateBookmarkRequestBody>, res: Response): Promise<void>;
  deleteBookmark(req: Request<IDeleteBookmarkRequestParams>, res: Response): Promise<void>;
}

class BookmarksController extends BaseController implements IBookmarksController {
  constructor(private readonly bookmarksService: IBookmarksService) {
    super();
  }

  createBookmark = async (req: Request<ParamsDictionary, object, ICreateBookmarkRequestBody>, res: Response) => {
    const userId = this.getUserId(req);
    const { postId } = req.body;

    const bookmark = await this.bookmarksService.bookmarkPost({
      userId,
      postId
    });

    if (!bookmark) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND);
    }

    this.sendResponse<ICreateBookmarkResponse>({
      res,
      instance: Created,
      data: bookmark,
      message: 'Bookmark post successfully'
    });
  };

  deleteBookmark = async (req: Request<IDeleteBookmarkRequestParams>, res: Response) => {
    const userId = this.getUserId(req);
    const { postId } = req.params;

    await this.bookmarksService.unbookmarkPost({
      userId,
      postId
    });

    this.sendResponse<IDeleteBookmarkResponse>({
      res,
      message: 'Unbookmark post successfully'
    });
  };
}

export default BookmarksController;
