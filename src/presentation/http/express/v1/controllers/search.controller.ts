import { ESearchType } from '@/modules/common/domain/enums/search.enum';
import { SearchPostsInPort } from '@/modules/post/application/use-cases/search-posts/search-posts.in-port';
import { SearchUsersInPort } from '@/modules/user/application/use-cases/search-users/search-users.in-port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import { PostDetailWithAuthorResponseDTO } from '@/presentation/http/express/v1/dtos/post/post.response.dto';
import { SearchCursorQueryDTO } from '@/presentation/http/express/v1/dtos/search/search.request.dto';
import { UserResponseDTO } from '@/presentation/http/express/v1/dtos/user/user.response.dto';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ISearchController {
  search(req: Request<ParamsDictionary, object, object, SearchCursorQueryDTO>): Promise<unknown>;
}

export class SearchController extends BaseController implements ISearchController {
  constructor(
    private readonly searchPostsUC: SearchPostsInPort,
    private readonly searchUsersUC: SearchUsersInPort
  ) {
    super();
  }

  @AutoBind()
  async search(req: Request<ParamsDictionary, object, object, SearchCursorQueryDTO>) {
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
