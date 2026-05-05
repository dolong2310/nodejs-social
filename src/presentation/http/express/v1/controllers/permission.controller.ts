import {
  CreatePermissionCommand,
  CreatePermissionInPort
} from '@/modules/permission/application/use-cases/create-permission/create-permission.in-port';
import {
  DeletePermissionCommand,
  DeletePermissionInPort
} from '@/modules/permission/application/use-cases/delete-permission/delete-permission.in-port';
import {
  GetPermissionInPort,
  GetPermissionQuery
} from '@/modules/permission/application/use-cases/get-permission/get-permission.in-port';
import {
  ListPermissionsInPort,
  ListPermissionsQuery
} from '@/modules/permission/application/use-cases/list-permissions/list-permissions.in-port';
import {
  UpdatePermissionCommand,
  UpdatePermissionInPort
} from '@/modules/permission/application/use-cases/update-permission/update-permission.in-port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import { PaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import {
  CreatePermissionBodyDTO,
  PermissionIdParamsDTO,
  UpdatePermissionBodyDTO
} from '@/presentation/http/express/v1/dtos/permission/permission.request.dto';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IPermissionController {
  list(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>): Promise<unknown>;
  create(req: Request<ParamsDictionary, object, CreatePermissionBodyDTO>): Promise<unknown>;
  getById(req: Request<PermissionIdParamsDTO>): Promise<unknown>;
  update(req: Request<PermissionIdParamsDTO, object, UpdatePermissionBodyDTO>): Promise<unknown>;
  remove(req: Request<PermissionIdParamsDTO>): Promise<unknown>;
}

export class PermissionController extends BaseController implements IPermissionController {
  constructor(
    private readonly listPermissionsUC: ListPermissionsInPort,
    private readonly getPermissionUC: GetPermissionInPort,
    private readonly createPermissionUC: CreatePermissionInPort,
    private readonly updatePermissionUC: UpdatePermissionInPort,
    private readonly deletePermissionUC: DeletePermissionInPort
  ) {
    super();
  }

  @AutoBind()
  async list(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>): Promise<unknown> {
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
  async create(req: Request<ParamsDictionary, object, CreatePermissionBodyDTO>): Promise<unknown> {
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
  async getById(req: Request<PermissionIdParamsDTO>): Promise<unknown> {
    const { permissionId } = req.params;
    const item = await this.getPermissionUC.execute(new GetPermissionQuery(permissionId));
    return this.response({ data: item, message: 'Get permission successfully' });
  }

  @AutoBind()
  async update(req: Request<PermissionIdParamsDTO, object, UpdatePermissionBodyDTO>): Promise<unknown> {
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
  async remove(req: Request<PermissionIdParamsDTO>): Promise<unknown> {
    const { permissionId } = req.params;
    await this.deletePermissionUC.execute(new DeletePermissionCommand(permissionId));
    return this.response({ message: 'Permission deleted successfully' });
  }
}
