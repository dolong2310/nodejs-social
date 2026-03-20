import { VALIDATION_ERROR_MESSAGE } from '@/constants/message.constant';
import { BaseController } from '@/controllers/base.controller';
import { CreateBookmarkRequestDTO, DeleteBookmarkParamsDTO } from '@/dtos/requests/bookmark.request.dto';
import { CreateBookmarkResponseDTO, DeleteBookmarkResponseDTO } from '@/dtos/responses/bookmark.response.dto';
import { BadRequestError } from '@/responses/error.response';
import { Created } from '@/responses/success.response';
import { IBookmarksService } from '@/services/bookmarks.service';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IBookmarksController {
  createBookmark(req: Request<ParamsDictionary, object, CreateBookmarkRequestDTO>, res: Response): Promise<void>;
  deleteBookmark(req: Request<DeleteBookmarkParamsDTO>, res: Response): Promise<void>;
}

class BookmarksController extends BaseController implements IBookmarksController {
  constructor(private readonly bookmarksService: IBookmarksService) {
    super();
  }

  createBookmark = async (req: Request<ParamsDictionary, object, CreateBookmarkRequestDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const dto = new CreateBookmarkRequestDTO(req.body);

    const bookmark = await this.bookmarksService.bookmarkPost({
      userId,
      postId: dto.postId
    });

    if (!bookmark) {
      throw new BadRequestError(VALIDATION_ERROR_MESSAGE.POST_NOT_FOUND);
    }

    this.sendResponse<CreateBookmarkResponseDTO>({
      res,
      instance: Created,
      data: bookmark,
      message: 'Bookmark post successfully'
    });
  };

  deleteBookmark = async (req: Request<DeleteBookmarkParamsDTO>, res: Response) => {
    const userId = this.getUserId(req);
    const { postId } = req.params;

    await this.bookmarksService.unbookmarkPost({
      userId,
      postId
    });

    this.sendResponse<DeleteBookmarkResponseDTO>({
      res,
      message: 'Unbookmark post successfully'
    });
  };
}

export default BookmarksController;
