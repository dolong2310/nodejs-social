import {
  CreatePermissionCommand,
  CreatePermissionPort
} from '@/modules/authorization/application/use-cases/create-permission/create-permission.port';
import {
  DeletePermissionCommand,
  DeletePermissionPort
} from '@/modules/authorization/application/use-cases/delete-permission/delete-permission.port';
import {
  GetPermissionPort,
  GetPermissionQuery
} from '@/modules/authorization/application/use-cases/get-permission/get-permission.port';
import {
  ListPermissionsPort,
  ListPermissionsQuery
} from '@/modules/authorization/application/use-cases/list-permissions/list-permissions.port';
import {
  UpdatePermissionCommand,
  UpdatePermissionPort
} from '@/modules/authorization/application/use-cases/update-permission/update-permission.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import { PaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import {
  CreatePermissionBodyDTO,
  PermissionIdParamsDTO,
  UpdatePermissionBodyDTO
} from '@/presentation/http/express/v1/dtos/permission/permission.request.dto';
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IPermissionController {
  list(
    req: ExpressRequest<ParamsDictionary, object, object, PaginationQueryDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  create(
    req: ExpressRequest<ParamsDictionary, object, CreatePermissionBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  getById(req: ExpressRequest<PermissionIdParamsDTO>, res: ExpressResponse, next: NextFunction): Promise<unknown>;
  update(
    req: ExpressRequest<PermissionIdParamsDTO, object, UpdatePermissionBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  remove(req: ExpressRequest<PermissionIdParamsDTO>, res: ExpressResponse, next: NextFunction): Promise<unknown>;
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
  async list(req: ExpressRequest<ParamsDictionary, object, object, PaginationQueryDTO>): Promise<unknown> {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const { items, total } = await this.listPermissionsUC.execute(new ListPermissionsQuery({ page, limit }));
    return this.paginatedResponse({
      data: items,
      pagination: { page, limit, totalItems: total },
      message: 'List permissions successfully'
    });
  }

  @AutoBind()
  async create(req: ExpressRequest<ParamsDictionary, object, CreatePermissionBodyDTO>): Promise<unknown> {
    const dto = new CreatePermissionBodyDTO(req.body);
    const item = await this.createPermissionUC.execute(
      new CreatePermissionCommand({
        name: dto.name,
        description: dto.description,
        path: dto.path,
        method: dto.method,
        module: dto.module
      })
    );
    return this.response({ instance: Created, data: item, message: 'Permission created successfully' });
  }

  @AutoBind()
  async getById(req: ExpressRequest<PermissionIdParamsDTO>): Promise<unknown> {
    const { permissionId } = req.params;
    const item = await this.getPermissionUC.execute(new GetPermissionQuery(permissionId));
    return this.response({ data: item, message: 'Get permission successfully' });
  }

  @AutoBind()
  async update(req: ExpressRequest<PermissionIdParamsDTO, object, UpdatePermissionBodyDTO>): Promise<unknown> {
    const { permissionId } = req.params;
    const dto = new UpdatePermissionBodyDTO(req.body);
    const item = await this.updatePermissionUC.execute(
      new UpdatePermissionCommand({
        id: permissionId,
        name: dto.name,
        description: dto.description,
        path: dto.path,
        method: dto.method,
        module: dto.module
      })
    );
    return this.response({ data: item, message: 'Permission updated successfully' });
  }

  @AutoBind()
  async remove(req: ExpressRequest<PermissionIdParamsDTO>): Promise<unknown> {
    const { permissionId } = req.params;
    await this.deletePermissionUC.execute(
      new DeletePermissionCommand({ id: permissionId, actorId: this.getUserId(req) })
    );
    return this.response({ message: 'Permission deleted successfully' });
  }
}
