import HTTP_STATUS from '@/constants/httpStatus.constant';
import { ESearchType } from '@/enums/search.enum';
import { ISearchRequestParams, ISearchRequestQuery } from '@/models/requests/search.request';
import searchService from '@/services/search.service';
import { Request, Response } from 'express';

export class SearchController {
  constructor() {}

  async search(req: Request<ISearchRequestParams, {}, {}, ISearchRequestQuery>, res: Response) {
    const { query = '', type, people_follow, page = 1, limit = 10 } = req.query;
    const userId = req.accessTokenPayload?.userId;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const [results, totalItems] = await [
      searchService.searchPosts({
        userId,
        query,
        type,
        peopleFollow: people_follow,
        page: pageNumber,
        limit: limitNumber
      }),
      searchService.searchUsers({
        userId,
        query,
        peopleFollow: people_follow,
        page: pageNumber,
        limit: limitNumber
      })
    ][Number(type === ESearchType.USER)];

    return res.status(HTTP_STATUS.OK).json({
      data: {
        data: results,
        page: pageNumber,
        limit: limitNumber,
        totalItems: totalItems,
        totalPages: Math.ceil(totalItems / limitNumber)
      }
    });
  }
}

export default new SearchController();
