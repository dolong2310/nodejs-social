import { IUser } from '@/domain/entities/user.entity';
import { ESearchType } from '@/domain/enums/search.enum';

import { ISearchService } from '@/application/ports/search.port';

import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { PostDetailResponseDTO } from '@/presentation/http/dtos/post/posts.response.dto';
import { SearchCursorQueryDTO } from '@/presentation/http/dtos/search/search.request.dto';

import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ISearchController {
  search(req: Request<ParamsDictionary, object, object, SearchCursorQueryDTO>, res: Response): Promise<void>;
}

export class SearchController extends BaseController implements ISearchController {
  constructor(private readonly searchService: ISearchService) {
    super();
  }

  @AutoBind()
  async search(req: Request<ParamsDictionary, object, object, SearchCursorQueryDTO>, res: Response) {
    const { query = '', type, people, cursor, limit } = req.query;
    const userId = this.getUserId(req, { optional: true });

    const { items, nextCursor } = await [
      this.searchService.searchPosts({
        userId,
        query,
        type,
        people,
        cursor,
        limit: Number(limit)
      }),
      this.searchService.searchUsers({
        userId,
        query,
        type,
        people,
        cursor,
        limit: Number(limit)
      })
    ][Number(type === ESearchType.USER)];

    this.sendCursorPaginatedResponse<PostDetailResponseDTO | IUser>({
      res,
      items,
      nextCursor,
      message: 'Search successfully'
    });
  }
}

export default SearchController;
