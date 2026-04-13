import { IBookmarksService } from '@/application/ports/bookmark.port';

import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import {
  CreateBookmarkRequestDTO,
  DeleteBookmarkParamsDTO
} from '@/presentation/http/dtos/bookmark/bookmarks.request.dto';
import {
  CreateBookmarkResponseDTO,
  DeleteBookmarkResponseDTO
} from '@/presentation/http/dtos/bookmark/bookmarks.response.dto';
import { Created } from '@/presentation/http/responses/success.response';

import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IBookmarksController {
  createBookmark(req: Request<ParamsDictionary, object, CreateBookmarkRequestDTO>, res: Response): Promise<void>;
  deleteBookmark(req: Request<DeleteBookmarkParamsDTO>, res: Response): Promise<void>;
}

export class BookmarksController extends BaseController implements IBookmarksController {
  constructor(private readonly bookmarksService: IBookmarksService) {
    super();
  }

  @AutoBind()
  async createBookmark(req: Request<ParamsDictionary, object, CreateBookmarkRequestDTO>, res: Response) {
    const userId = this.getUserId(req);
    const dto = new CreateBookmarkRequestDTO(req.body);

    const bookmark = await this.bookmarksService.bookmarkPost({
      userId,
      postId: dto.postId
    });

    this.sendResponse<CreateBookmarkResponseDTO>({
      res,
      instance: Created,
      data: bookmark,
      message: 'Bookmark post successfully'
    });
  }

  @AutoBind()
  async deleteBookmark(req: Request<DeleteBookmarkParamsDTO>, res: Response) {
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
  }
}
