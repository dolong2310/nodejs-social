import { BaseController } from '@/controllers/base.controller';
import { ESearchType } from '@/enums/search.enum';
import { ISearchRequestParams, ISearchRequestQuery } from '@/models/requests/search.request';
import { OK } from '@/responses/success.response';
import { ISearchService } from '@/services/search.service';
import { Request, Response } from 'express';

export interface ISearchController {
  search(req: Request<ISearchRequestParams, {}, {}, ISearchRequestQuery>, res: Response): Promise<void>;
}

export class SearchController extends BaseController implements ISearchController {
  constructor(private readonly searchService: ISearchService) {
    super();
  }

  search = async (req: Request<ISearchRequestParams, {}, {}, ISearchRequestQuery>, res: Response) => {
    const { query = '', type, people_follow, page = 1, limit = 10 } = req.query;
    const userId = this.getUserId(req);

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const [results, totalItems] = await [
      this.searchService.searchPosts({
        userId,
        query,
        type,
        peopleFollow: people_follow,
        page: pageNumber,
        limit: limitNumber
      }),
      this.searchService.searchUsers({
        userId,
        query,
        peopleFollow: people_follow,
        page: pageNumber,
        limit: limitNumber
      })
    ][Number(type === ESearchType.USER)];

    new OK({
      data: {
        data: results,
        page: pageNumber,
        limit: limitNumber,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / limitNumber)
      },
      message: 'Search successfully'
    }).send(res);
  };
}

export default SearchController;
