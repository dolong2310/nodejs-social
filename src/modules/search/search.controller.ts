import { AutoBind } from '@/decorators';
import { Injectable } from '@/decorators/injectable.decorator';
import { BaseController } from '@/modules/base/base.controller';
import { PostDetailResponseDTO } from '@/modules/posts/dtos/posts.response.dto';
import { SearchQueryDTO } from '@/modules/search/dtos/search.request.dto';
import { ESearchType } from '@/modules/search/search.enum';
import { SearchService } from '@/modules/search/search.service';
import { IUser } from '@/modules/users/users.schema';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ISearchController {
  search(req: Request<ParamsDictionary, object, object, SearchQueryDTO>, res: Response): Promise<void>;
}

@Injectable()
export class SearchController extends BaseController implements ISearchController {
  constructor(private readonly searchService: SearchService) {
    super();
  }

  @AutoBind()
  async search(req: Request<ParamsDictionary, object, object, SearchQueryDTO>, res: Response) {
    const { query = '', type, people, page = '1', limit = '10' } = req.query;
    const userId = this.getUserId(req, { optional: true });

    const [results, totalItems] = await [
      this.searchService.searchPosts({
        userId,
        query,
        type,
        people,
        page,
        limit
      }),
      this.searchService.searchUsers({
        userId,
        query,
        type,
        people,
        page,
        limit
      })
    ][Number(type === ESearchType.USER)];

    this.sendPaginatedResponse<PostDetailResponseDTO[] | IUser[]>({
      res,
      data: results,
      pagination: {
        page,
        limit,
        totalItems: totalItems
      },
      message: 'Search successfully'
    });
  }
}

export default SearchController;
