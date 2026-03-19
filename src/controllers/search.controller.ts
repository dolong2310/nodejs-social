import { BaseController } from '@/controllers/base.controller';
import { ESearchType } from '@/enums/search.enum';
import { ISearchRequestQuery } from '@/models/requests/search.request';
import { IPostDetailResponse } from '@/models/responses/post.response';
import { IUser } from '@/models/schemas/user.schema';
import { ISearchService } from '@/services/search.service';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ISearchController {
  search(req: Request<ParamsDictionary, object, object, ISearchRequestQuery>, res: Response): Promise<void>;
}

export class SearchController extends BaseController implements ISearchController {
  constructor(private readonly searchService: ISearchService) {
    super();
  }

  search = async (req: Request<ParamsDictionary, object, object, ISearchRequestQuery>, res: Response) => {
    const { query = '', type, people_follow, page = '1', limit = '10' } = req.query;
    const userId = this.getUserId(req);

    const [results, totalItems] = await [
      this.searchService.searchPosts({
        userId,
        query,
        type,
        peopleFollow: people_follow,
        page,
        limit
      }),
      this.searchService.searchUsers({
        userId,
        query,
        peopleFollow: people_follow,
        page,
        limit
      })
    ][Number(type === ESearchType.USER)];

    this.sendPaginatedResponse<IPostDetailResponse[] | IUser[]>({
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
