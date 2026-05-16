import {
  CreateRoleCommand,
  CreateRolePort
} from '@/modules/authorization/application/use-cases/create-role/create-role.port';
import {
  DeleteRoleCommand,
  DeleteRolePort
} from '@/modules/authorization/application/use-cases/delete-role/delete-role.port';
import { GetRolePort, GetRoleQuery } from '@/modules/authorization/application/use-cases/get-role/get-role.port';
import {
  ListRolesPort,
  ListRolesQuery
} from '@/modules/authorization/application/use-cases/list-roles/list-roles.port';
import {
  UpdateRoleCommand,
  UpdateRolePort
} from '@/modules/authorization/application/use-cases/update-role/update-role.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import { PaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import {
  CreateRoleBodyDTO,
  RoleIdParamsDTO,
  UpdateRoleBodyDTO
} from '@/presentation/http/express/v1/dtos/role/role.request.dto';
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IRoleController {
  list(
    req: ExpressRequest<ParamsDictionary, object, object, PaginationQueryDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  create(
    req: ExpressRequest<ParamsDictionary, object, CreateRoleBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  getById(req: ExpressRequest<RoleIdParamsDTO>, res: ExpressResponse, next: NextFunction): Promise<unknown>;
  update(
    req: ExpressRequest<RoleIdParamsDTO, object, UpdateRoleBodyDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  remove(req: ExpressRequest<RoleIdParamsDTO>, res: ExpressResponse, next: NextFunction): Promise<unknown>;
}

export class RoleController extends BaseController implements IRoleController {
  constructor(
    private readonly listRolesUC: ListRolesPort,
    private readonly getRoleUC: GetRolePort,
    private readonly createRoleUC: CreateRolePort,
    private readonly updateRoleUC: UpdateRolePort,
    private readonly deleteRoleUC: DeleteRolePort
  ) {
    super();
  }

  @AutoBind()
  async list(req: ExpressRequest<ParamsDictionary, object, object, PaginationQueryDTO>): Promise<unknown> {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const { items, total } = await this.listRolesUC.execute(new ListRolesQuery({ page, limit }));
    return this.paginatedResponse({
      data: items,
      pagination: { page, limit, totalItems: total },
      message: 'List roles successfully'
    });
  }

  @AutoBind()
  async create(req: ExpressRequest<ParamsDictionary, object, CreateRoleBodyDTO>): Promise<unknown> {
    const dto = new CreateRoleBodyDTO(req.body);
    const item = await this.createRoleUC.execute(
      new CreateRoleCommand({
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
        permissionIds: dto.permissionIds
      })
    );
    return this.response({ instance: Created, data: item, message: 'Role created successfully' });
  }

  @AutoBind()
  async getById(req: ExpressRequest<RoleIdParamsDTO>): Promise<unknown> {
    const { roleId } = req.params;
    const item = await this.getRoleUC.execute(new GetRoleQuery(roleId));
    return this.response({ data: item, message: 'Get role successfully' });
  }

  @AutoBind()
  async update(req: ExpressRequest<RoleIdParamsDTO, object, UpdateRoleBodyDTO>): Promise<unknown> {
    const { roleId } = req.params;
    const dto = new UpdateRoleBodyDTO(req.body);
    const item = await this.updateRoleUC.execute(
      new UpdateRoleCommand({
        id: roleId,
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
        permissionIds: dto.permissionIds
      })
    );
    return this.response({ data: item, message: 'Role updated successfully' });
  }

  @AutoBind()
  async remove(req: ExpressRequest<RoleIdParamsDTO>): Promise<unknown> {
    const { roleId } = req.params;
    await this.deleteRoleUC.execute(new DeleteRoleCommand({ id: roleId, actorId: this.getUserId(req) }));
    return this.response({ message: 'Role deleted successfully' });
  }
}
