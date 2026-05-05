import { BookmarkPostPort } from '@/modules/bookmark/application/use-cases/bookmark-post/bookmark-post.port';
import { UnbookmarkPostPort } from '@/modules/bookmark/application/use-cases/unbookmark-post/unbookmark-post.port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import {
  CreateBookmarkRequestDTO,
  DeleteBookmarkParamsDTO
} from '@/presentation/http/express/v1/dtos/bookmark/bookmark.request.dto';
import {
  CreateBookmarkResponseDTO,
  DeleteBookmarkResponseDTO
} from '@/presentation/http/express/v1/dtos/bookmark/bookmark.response.dto';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IBookmarkController {
  createBookmark(req: Request<ParamsDictionary, object, CreateBookmarkRequestDTO>): Promise<unknown>;
  deleteBookmark(req: Request<DeleteBookmarkParamsDTO>): Promise<unknown>;
}

export class BookmarkController extends BaseController implements IBookmarkController {
  constructor(
    private readonly createBookmarkUC: BookmarkPostPort,
    private readonly unbookmarkPostUC: UnbookmarkPostPort
  ) {
    super();
  }

  @AutoBind()
  async createBookmark(req: Request<ParamsDictionary, object, CreateBookmarkRequestDTO>) {
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
  async deleteBookmark(req: Request<DeleteBookmarkParamsDTO>) {
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
