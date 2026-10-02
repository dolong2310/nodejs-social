import {
  CreatePermissionInputPort,
  type CreatePermissionPort
} from '@/modules/authorization/application/use-cases/create-permission/create-permission.port';
import {
  DeletePermissionInputPort,
  type DeletePermissionPort
} from '@/modules/authorization/application/use-cases/delete-permission/delete-permission.port';
import {
  type GetPermissionPort,
  GetPermissionInputPort
} from '@/modules/authorization/application/use-cases/get-permission/get-permission.port';
import {
  type ListPermissionsPort,
  ListPermissionsInputPort
} from '@/modules/authorization/application/use-cases/list-permissions/list-permissions.port';
import {
  UpdatePermissionInputPort,
  type UpdatePermissionPort
} from '@/modules/authorization/application/use-cases/update-permission/update-permission.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import type { ValidatedRequest } from '@/presentation/http/express/types';
import type { PaginationQuerySchema } from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import type {
  CreatePermissionBodySchema,
  PermissionIdParamsSchema,
  UpdatePermissionBodySchema
} from '@/presentation/http/express/v1/schemas/permission/permission.request.schema';
import type { PermissionResponse } from '@/presentation/http/express/v1/schemas/permission/permission.response.schema';

type ListPermissionsRequest = ValidatedRequest<{ query: typeof PaginationQuerySchema }>;
type CreatePermissionRequest = ValidatedRequest<{ body: typeof CreatePermissionBodySchema }>;
type PermissionIdRequest = ValidatedRequest<{ params: typeof PermissionIdParamsSchema }>;
type UpdatePermissionRequest = ValidatedRequest<{
  params: typeof PermissionIdParamsSchema;
  body: typeof UpdatePermissionBodySchema;
}>;

export interface IPermissionController {
  list(req: ListPermissionsRequest): Promise<unknown>;
  create(req: CreatePermissionRequest): Promise<unknown>;
  getById(req: PermissionIdRequest): Promise<unknown>;
  update(req: UpdatePermissionRequest): Promise<unknown>;
  remove(req: PermissionIdRequest): Promise<unknown>;
}

export class PermissionController extends BaseController implements IPermissionController {
  constructor(
    private readonly listPermissionsUC: ListPermissionsPort,
    private readonly getPermissionUC: GetPermissionPort,
    private readonly createPermissionUC: CreatePermissionPort,
    private readonly updatePermissionUC: UpdatePermissionPort,
    private readonly deletePermissionUC: DeletePermissionPort
  ) {
    super();
  }

  @AutoBind()
  async list(req: ListPermissionsRequest): Promise<unknown> {
    const { page, limit } = req.query;
    const { items, total } = await this.listPermissionsUC.execute(new ListPermissionsInputPort({ page, limit }));
    return this.paginatedResponse<PermissionResponse[]>({
      data: items,
      pagination: { page, limit, totalItems: total },
      message: 'List permissions successfully'
    });
  }

  @AutoBind()
  async create(req: CreatePermissionRequest): Promise<unknown> {
    const body = req.body;
    const item = await this.createPermissionUC.execute(
      new CreatePermissionInputPort({
        name: body.name,
        description: body.description,
        path: body.path,
        method: body.method,
        module: body.module
      })
    );
    return this.response<PermissionResponse>({
      instance: Created,
      data: item,
      message: 'Permission created successfully'
    });
  }

  @AutoBind()
  async getById(req: PermissionIdRequest): Promise<unknown> {
    const { permissionId } = req.params;
    const item = await this.getPermissionUC.execute(new GetPermissionInputPort(permissionId));
    return this.response<PermissionResponse>({ data: item, message: 'Get permission successfully' });
  }

  @AutoBind()
  async update(req: UpdatePermissionRequest): Promise<unknown> {
    const { permissionId } = req.params;
    const body = req.body;
    const item = await this.updatePermissionUC.execute(
      new UpdatePermissionInputPort({
        id: permissionId,
        name: body.name,
        description: body.description,
        path: body.path,
        method: body.method,
        module: body.module
      })
    );
    return this.response<PermissionResponse>({ data: item, message: 'Permission updated successfully' });
  }

  @AutoBind()
  async remove(req: PermissionIdRequest): Promise<unknown> {
    const { permissionId } = req.params;
    await this.deletePermissionUC.execute(
      new DeletePermissionInputPort({ id: permissionId, actorId: this.getUserId(req) })
    );
    return this.response({ message: 'Permission deleted successfully' });
  }
}
