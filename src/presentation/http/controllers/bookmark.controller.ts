import { BookmarkPostInPort } from '@/application/use-cases/bookmark/bookmark-post/bookmark-post.in-port';
import { UnbookmarkPostInPort } from '@/application/use-cases/bookmark/unbookmark-post/unbookmark-post.in-port';
import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import {
  CreateBookmarkRequestDTO,
  DeleteBookmarkParamsDTO
} from '@/presentation/http/dtos/bookmark/bookmark.request.dto';
import {
  CreateBookmarkResponseDTO,
  DeleteBookmarkResponseDTO
} from '@/presentation/http/dtos/bookmark/bookmark.response.dto';
import { Created } from '@/presentation/http/responses/success.response';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IBookmarkController {
  createBookmark(req: Request<ParamsDictionary, object, CreateBookmarkRequestDTO>, res: Response): Promise<void>;
  deleteBookmark(req: Request<DeleteBookmarkParamsDTO>, res: Response): Promise<void>;
}

export class BookmarkController extends BaseController implements IBookmarkController {
  constructor(
    private readonly createBookmarkUC: BookmarkPostInPort,
    private readonly unbookmarkPostUC: UnbookmarkPostInPort
  ) {
    super();
  }

  @AutoBind()
  async createBookmark(req: Request<ParamsDictionary, object, CreateBookmarkRequestDTO>, res: Response) {
    const userId = this.getUserId(req);
    const dto = new CreateBookmarkRequestDTO(req.body);

    const bookmark = await this.createBookmarkUC.execute({
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

    await this.unbookmarkPostUC.execute({
      userId,
      postId
    });

    this.sendResponse<DeleteBookmarkResponseDTO>({
      res,
      message: 'Unbookmark post successfully'
    });
  }
}
