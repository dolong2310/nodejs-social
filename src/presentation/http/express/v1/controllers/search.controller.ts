import { ESearchType } from '@/modules/common/domain/enums/search.enum';
import { SearchPostsPort } from '@/modules/post/application/use-cases/search-posts/search-posts.port';
import { SearchUsersPort } from '@/modules/user/application/use-cases/search-users/search-users.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import { PostDetailWithAuthorResponseDTO } from '@/presentation/http/express/v1/dtos/post/post.response.dto';
import { SearchCursorQueryDTO } from '@/presentation/http/express/v1/dtos/search/search.request.dto';
import { UserResponseDTO } from '@/presentation/http/express/v1/dtos/user/user.response.dto';
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ISearchController {
  search(
    req: ExpressRequest<ParamsDictionary, object, object, SearchCursorQueryDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
}

export class SearchController extends BaseController implements ISearchController {
  constructor(
    private readonly searchPostsUC: SearchPostsPort,
    private readonly searchUsersUC: SearchUsersPort
  ) {
    super();
  }

  @AutoBind()
  async search(req: ExpressRequest<ParamsDictionary, object, object, SearchCursorQueryDTO>) {
    const { query = '', type, people, cursor, limit } = req.query;
    const userId = this.getUserId(req, { optional: true });

    let items: PostDetailWithAuthorResponseDTO[] | UserResponseDTO[];
    let nextCursor: string | null;

    if (type === ESearchType.USER) {
      const result = await this.searchUsersUC.execute({
        userId,
        query,
        type,
        people,
        cursor,
        limit: Number(limit)
      });
      items = result.items;
      nextCursor = result.nextCursor;
    } else {
      const result = await this.searchPostsUC.execute<PostDetailWithAuthorResponseDTO>({
        userId,
        query,
        type,
        people,
        cursor,
        limit: Number(limit)
      });
      items = result.items;
      nextCursor = result.nextCursor;
    }

    return this.cursorPaginatedResponse<PostDetailWithAuthorResponseDTO | UserResponseDTO>({
      items,
      nextCursor,
      message: 'Search successfully'
    });
  }
}

export default SearchController;
