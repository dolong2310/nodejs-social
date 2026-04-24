import { SearchPostsInPort } from '@/application/use-cases/search/search-posts/search-posts.in-port';
import { SearchUsersInPort } from '@/application/use-cases/search/search-users/search-users.in-port';
import { ESearchType } from '@/domain/enums/search.enum';
import { BaseController } from '@/presentation/http/controllers/base.controller';
import { AutoBind } from '@/presentation/http/decorators/autoBind.decorator';
import { PostDetailWithAuthorResponseDTO } from '@/presentation/http/dtos/post/post.response.dto';
import { SearchCursorQueryDTO } from '@/presentation/http/dtos/search/search.request.dto';
import { UserResponseDTO } from '@/presentation/http/dtos/user/user.response.dto';
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface ISearchController {
  search(req: Request<ParamsDictionary, object, object, SearchCursorQueryDTO>, res: Response): Promise<void>;
}

export class SearchController extends BaseController implements ISearchController {
  constructor(
    private readonly searchPostsUC: SearchPostsInPort,
    private readonly searchUsersUC: SearchUsersInPort
  ) {
    super();
  }

  @AutoBind()
  async search(req: Request<ParamsDictionary, object, object, SearchCursorQueryDTO>, res: Response) {
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

    this.sendCursorPaginatedResponse<PostDetailWithAuthorResponseDTO | UserResponseDTO>({
      res,
      items,
      nextCursor,
      message: 'Search successfully'
    });
  }
}

export default SearchController;
