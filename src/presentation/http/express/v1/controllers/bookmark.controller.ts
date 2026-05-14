import { BookmarkPostPort } from '@/modules/post/application/use-cases/bookmark-post/bookmark-post.port';
import { UnbookmarkPostPort } from '@/modules/post/application/use-cases/unbookmark-post/unbookmark-post.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created, SuccessResponse } from '@/presentation/http/express/responses/success.response';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import {
  CreateBookmarkRequestDTO,
  DeleteBookmarkParamsDTO
} from '@/presentation/http/express/v1/dtos/bookmark/bookmark.request.dto';
import {
  CreateBookmarkResponseDTO,
  DeleteBookmarkResponseDTO
} from '@/presentation/http/express/v1/dtos/bookmark/bookmark.response.dto';
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IBookmarkController {
  createBookmark(
    req: ExpressRequest<ParamsDictionary, object, CreateBookmarkRequestDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<CreateBookmarkResponseDTO>>;
  deleteBookmark(
    req: ExpressRequest<DeleteBookmarkParamsDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<SuccessResponse<DeleteBookmarkResponseDTO>>;
}

export class BookmarkController extends BaseController implements IBookmarkController {
  constructor(
    private readonly createBookmarkUC: BookmarkPostPort,
    private readonly unbookmarkPostUC: UnbookmarkPostPort
  ) {
    super();
  }

  @AutoBind()
  async createBookmark(req: ExpressRequest<ParamsDictionary, object, CreateBookmarkRequestDTO>) {
    const userId = this.getUserId(req);
    const dto = new CreateBookmarkRequestDTO(req.body);

    const bookmark = await this.createBookmarkUC.execute({
      userId,
      postId: dto.postId
    });

    return this.response<CreateBookmarkResponseDTO>({
      instance: Created,
      data: bookmark,
      message: 'Bookmark post successfully'
    });
  }

  @AutoBind()
  async deleteBookmark(req: ExpressRequest<DeleteBookmarkParamsDTO>) {
    const userId = this.getUserId(req);
    const { postId } = req.params;

    await this.unbookmarkPostUC.execute({
      userId,
      postId
    });

    return this.response<DeleteBookmarkResponseDTO>({
      message: 'Unbookmark post successfully'
    });
  }
}
