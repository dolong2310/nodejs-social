import {
  CreateHashtagCommand,
  CreateHashtagPort
} from '@/modules/hashtag/application/use-cases/create-hashtag/create-hashtag.port';
import {
  DeleteHashtagCommand,
  DeleteHashtagPort
} from '@/modules/hashtag/application/use-cases/delete-hashtag/delete-hashtag.port';
import { GetHashtagPort, GetHashtagQuery } from '@/modules/hashtag/application/use-cases/get-hashtag/get-hashtag.port';
import {
  ListHashtagsPort,
  ListHashtagsQuery
} from '@/modules/hashtag/application/use-cases/list-hashtags/list-hashtags.port';
import {
  UpdateHashtagCommand,
  UpdateHashtagPort
} from '@/modules/hashtag/application/use-cases/update-hashtag/update-hashtag.port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import { PaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import {
  CreateHashtagBodyDTO,
  HashtagIdParamsDTO,
  UpdateHashtagBodyDTO
} from '@/presentation/http/express/v1/dtos/hashtag/hashtag.request.dto';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IHashtagController {
  list(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>): Promise<unknown>;
  create(req: Request<ParamsDictionary, object, CreateHashtagBodyDTO>): Promise<unknown>;
  getById(req: Request<HashtagIdParamsDTO>): Promise<unknown>;
  update(req: Request<HashtagIdParamsDTO, object, UpdateHashtagBodyDTO>): Promise<unknown>;
  remove(req: Request<HashtagIdParamsDTO>): Promise<unknown>;
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
  async list(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>): Promise<unknown> {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const { items, total } = await this.listHashtagsUC.execute(new ListHashtagsQuery({ page, limit }));
    return this.paginatedResponse({
      data: items,
      pagination: { page, limit, totalItems: total },
      message: 'List hashtags successfully'
    });
  }

  @AutoBind()
  async create(req: Request<ParamsDictionary, object, CreateHashtagBodyDTO>): Promise<unknown> {
    const dto = new CreateHashtagBodyDTO(req.body);
    const item = await this.createHashtagUC.execute(new CreateHashtagCommand({ name: dto.name }));
    return this.response({ instance: Created, data: item, message: 'Hashtag created successfully' });
  }

  @AutoBind()
  async getById(req: Request<HashtagIdParamsDTO>): Promise<unknown> {
    const { hashtagId } = req.params;
    const item = await this.getHashtagUC.execute(new GetHashtagQuery(hashtagId));
    return this.response({ data: item, message: 'Get hashtag successfully' });
  }

  @AutoBind()
  async update(req: Request<HashtagIdParamsDTO, object, UpdateHashtagBodyDTO>): Promise<unknown> {
    const { hashtagId } = req.params;
    const dto = new UpdateHashtagBodyDTO(req.body);
    const item = await this.updateHashtagUC.execute(
      new UpdateHashtagCommand({
        id: hashtagId,
        name: dto.name
      })
    );
    return this.response({ data: item, message: 'Hashtag updated successfully' });
  }

  @AutoBind()
  async remove(req: Request<HashtagIdParamsDTO>): Promise<unknown> {
    const { hashtagId } = req.params;
    await this.deleteHashtagUC.execute(new DeleteHashtagCommand(hashtagId));
    return this.response({ message: 'Hashtag deleted successfully' });
  }
}
