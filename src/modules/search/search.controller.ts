import { AutoBind } from '@/decorators';
import { Injectable } from '@/decorators/injectable.decorator';
import { BaseController } from '@/modules/base/base.controller';
import { PostDetailResponseDTO } from '@/modules/posts/dtos/posts.response.dto';
import { SearchCursorQueryDTO } from '@/modules/search/dtos/search.request.dto';
import { ESearchType } from '@/modules/search/search.enum';
import { SearchService } from '@/modules/search/search.service';
import { IUser } from '@/modules/users/users.schema';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ISearchController {
  search(req: Request<ParamsDictionary, object, object, SearchCursorQueryDTO>, res: Response): Promise<void>;
}

@Injectable()
export class SearchController extends BaseController implements ISearchController {
  constructor(private readonly searchService: SearchService) {
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
        limit
      }),
      this.searchService.searchUsers({
        userId,
        query,
        type,
        people,
        cursor,
        limit
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
