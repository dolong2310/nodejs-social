import {
  CreateHashtagInputPort,
  type CreateHashtagPort
} from '@/modules/post/application/use-cases/create-hashtag/create-hashtag.port';
import {
  DeleteHashtagInputPort,
  type DeleteHashtagPort
} from '@/modules/post/application/use-cases/delete-hashtag/delete-hashtag.port';
import {
  type GetHashtagPort,
  GetHashtagInputPort
} from '@/modules/post/application/use-cases/get-hashtag/get-hashtag.port';
import {
  type ListHashtagsPort,
  ListHashtagsInputPort
} from '@/modules/post/application/use-cases/list-hashtags/list-hashtags.port';
import {
  UpdateHashtagInputPort,
  type UpdateHashtagPort
} from '@/modules/post/application/use-cases/update-hashtag/update-hashtag.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import type { ValidatedRequest } from '@/presentation/http/express/types';
import type { PaginationQuerySchema } from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import type {
  CreateHashtagBodySchema,
  HashtagIdParamsSchema,
  UpdateHashtagBodySchema
} from '@/presentation/http/express/v1/schemas/hashtag/hashtag.request.schema';
import type { HashtagResponse } from '@/presentation/http/express/v1/schemas/hashtag/hashtag.response.schema';

type ListHashtagsRequest = ValidatedRequest<{ query: typeof PaginationQuerySchema }>;
type CreateHashtagRequest = ValidatedRequest<{ body: typeof CreateHashtagBodySchema }>;
type HashtagIdRequest = ValidatedRequest<{ params: typeof HashtagIdParamsSchema }>;
type UpdateHashtagRequest = ValidatedRequest<{
  params: typeof HashtagIdParamsSchema;
  body: typeof UpdateHashtagBodySchema;
}>;

export interface IHashtagController {
  list(req: ListHashtagsRequest): Promise<unknown>;
  create(req: CreateHashtagRequest): Promise<unknown>;
  getById(req: HashtagIdRequest): Promise<unknown>;
  update(req: UpdateHashtagRequest): Promise<unknown>;
  remove(req: HashtagIdRequest): Promise<unknown>;
}

export class HashtagController extends BaseController implements IHashtagController {
  constructor(
    private readonly listHashtagsUC: ListHashtagsPort,
    private readonly getHashtagUC: GetHashtagPort,
    private readonly createHashtagUC: CreateHashtagPort,
    private readonly updateHashtagUC: UpdateHashtagPort,
    private readonly deleteHashtagUC: DeleteHashtagPort
  ) {
    super();
  }

  @AutoBind()
  async list(req: ListHashtagsRequest): Promise<unknown> {
    const { page, limit } = req.query;
    const { items, total } = await this.listHashtagsUC.execute(new ListHashtagsInputPort({ page, limit }));
    return this.paginatedResponse<HashtagResponse[]>({
      data: items,
      pagination: { page, limit, totalItems: total },
      message: 'List hashtags successfully'
    });
  }

  @AutoBind()
  async create(req: CreateHashtagRequest): Promise<unknown> {
    const body = req.body;
    const item = await this.createHashtagUC.execute(new CreateHashtagInputPort({ name: body.name }));
    return this.response<HashtagResponse>({ instance: Created, data: item, message: 'Hashtag created successfully' });
  }

  @AutoBind()
  async getById(req: HashtagIdRequest): Promise<unknown> {
    const { hashtagId } = req.params;
    const item = await this.getHashtagUC.execute(new GetHashtagInputPort(hashtagId));
    return this.response<HashtagResponse>({ data: item, message: 'Get hashtag successfully' });
  }

  @AutoBind()
  async update(req: UpdateHashtagRequest): Promise<unknown> {
    const { hashtagId } = req.params;
    const body = req.body;
    const item = await this.updateHashtagUC.execute(
      new UpdateHashtagInputPort({
        id: hashtagId,
        name: body.name
      })
    );
    return this.response<HashtagResponse>({ data: item, message: 'Hashtag updated successfully' });
  }

  @AutoBind()
  async remove(req: HashtagIdRequest): Promise<unknown> {
    const { hashtagId } = req.params;
    await this.deleteHashtagUC.execute(new DeleteHashtagInputPort({ id: hashtagId, actorId: this.getUserId(req) }));
    return this.response({ message: 'Hashtag deleted successfully' });
  }
}
