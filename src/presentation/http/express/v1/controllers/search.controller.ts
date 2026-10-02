import { EnumSearchType } from '@/modules/common/domain/enums/search.enum';
import type { SearchPostsPort } from '@/modules/post/application/use-cases/search-posts/search-posts.port';
import type { SearchUsersPort } from '@/modules/user/application/use-cases/search-users/search-users.port';
import type { UserSafeProps } from '@/modules/user/domain/entities/user.types';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import type { ValidatedRequest } from '@/presentation/http/express/types';
import type { PostDetailWithAuthorResponse } from '@/presentation/http/express/v1/schemas/post/post.response.schema';
import type { SearchQuerySchema } from '@/presentation/http/express/v1/schemas/search/search.request.schema';

type SearchRequest = ValidatedRequest<{ query: typeof SearchQuerySchema }>;

export interface ISearchController {
  search(req: SearchRequest): Promise<unknown>;
}

@AutoBind()
export class SearchController extends BaseController implements ISearchController {
  constructor(
    private readonly searchPostsUC: SearchPostsPort,
    private readonly searchUsersUC: SearchUsersPort
  ) {
    super();
  }

  async search(req: SearchRequest) {
    const { query, type, people, cursor, limit } = req.query;
    const userId = this.getUserId(req, { optional: true });

    let items: PostDetailWithAuthorResponse[] | UserSafeProps[];
    let nextCursor: string | null;

    if (type === EnumSearchType.USER) {
      const result = await this.searchUsersUC.execute({
        userId,
        query,
        type,
        people,
        cursor,
        limit
      });
      items = result.items;
      nextCursor = result.nextCursor;
    } else {
      const result = await this.searchPostsUC.execute<PostDetailWithAuthorResponse>({
        userId,
        query,
        type,
        people,
        cursor,
        limit
      });
      items = result.items;
      nextCursor = result.nextCursor;
    }

    return this.cursorPaginatedResponse<PostDetailWithAuthorResponse | UserSafeProps>({
      items,
      nextCursor,
      message: 'Search successfully'
    });
  }
}

export default SearchController;
