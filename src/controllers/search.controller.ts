import { BaseController } from '@/controllers/base.controller';
import { SearchQueryDTO } from '@/dtos/requests/search.request.dto';
import { PostDetailResponseDTO } from '@/dtos/responses/post.response.dto';
import { ESearchType } from '@/enums/search.enum';
import { IUser } from '@/models/user.schema';
import { ISearchService } from '@/services/search.service';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ISearchController {
  search(req: Request<ParamsDictionary, object, object, SearchQueryDTO>, res: Response): Promise<void>;
}

export class SearchController extends BaseController implements ISearchController {
  constructor(private readonly searchService: ISearchService) {
    super();
  }

  search = async (req: Request<ParamsDictionary, object, object, SearchQueryDTO>, res: Response) => {
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
  };
}

export default SearchController;
