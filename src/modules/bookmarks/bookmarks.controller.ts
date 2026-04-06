import { AutoBind } from '@/decorators';
import { Injectable } from '@/decorators/injectable.decorator';
import { BaseController } from '@/modules/base/base.controller';
import { BookmarksService } from '@/modules/bookmarks/bookmarks.service';
import { CreateBookmarkRequestDTO, DeleteBookmarkParamsDTO } from '@/modules/bookmarks/dtos/bookmarks.request.dto';
import { CreateBookmarkResponseDTO, DeleteBookmarkResponseDTO } from '@/modules/bookmarks/dtos/bookmarks.response.dto';
import { Created } from '@/providers/httpResponses/success.response';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IBookmarksController {
  createBookmark(req: Request<ParamsDictionary, object, CreateBookmarkRequestDTO>, res: Response): Promise<void>;
  deleteBookmark(req: Request<DeleteBookmarkParamsDTO>, res: Response): Promise<void>;
}

@Injectable()
export class BookmarksController extends BaseController implements IBookmarksController {
  constructor(private readonly bookmarksService: BookmarksService) {
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
