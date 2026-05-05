import {
  CreateRoleCommand,
  CreateRoleInPort
} from '@/modules/role/application/use-cases/create-role/create-role.in-port';
import {
  DeleteRoleCommand,
  DeleteRoleInPort
} from '@/modules/role/application/use-cases/delete-role/delete-role.in-port';
import { GetRoleInPort, GetRoleQuery } from '@/modules/role/application/use-cases/get-role/get-role.in-port';
import { ListRolesInPort, ListRolesQuery } from '@/modules/role/application/use-cases/list-roles/list-roles.in-port';
import {
  UpdateRoleCommand,
  UpdateRoleInPort
} from '@/modules/role/application/use-cases/update-role/update-role.in-port';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { BaseController } from '@/presentation/http/express/v1/controllers/base.controller';
import { PaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import {
  CreateRoleBodyDTO,
  RoleIdParamsDTO,
  UpdateRoleBodyDTO
} from '@/presentation/http/express/v1/dtos/role/role.request.dto';
import { Request } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IRoleController {
  list(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>): Promise<unknown>;
  create(req: Request<ParamsDictionary, object, CreateRoleBodyDTO>): Promise<unknown>;
  getById(req: Request<RoleIdParamsDTO>): Promise<unknown>;
  update(req: Request<RoleIdParamsDTO, object, UpdateRoleBodyDTO>): Promise<unknown>;
  remove(req: Request<RoleIdParamsDTO>): Promise<unknown>;
}

export class RoleController extends BaseController implements IRoleController {
  constructor(
    private readonly listRolesUC: ListRolesInPort,
    private readonly getRoleUC: GetRoleInPort,
    private readonly createRoleUC: CreateRoleInPort,
    private readonly updateRoleUC: UpdateRoleInPort,
    private readonly deleteRoleUC: DeleteRoleInPort
  ) {
    super();
  }

  @AutoBind()
  async list(req: Request<ParamsDictionary, object, object, PaginationQueryDTO>): Promise<unknown> {
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
  async create(req: Request<ParamsDictionary, object, CreateRoleBodyDTO>): Promise<unknown> {
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
  async getById(req: Request<RoleIdParamsDTO>): Promise<unknown> {
    const { roleId } = req.params;
    const item = await this.getRoleUC.execute(new GetRoleQuery(roleId));
    return this.response({ data: item, message: 'Get role successfully' });
  }

  @AutoBind()
  async update(req: Request<RoleIdParamsDTO, object, UpdateRoleBodyDTO>): Promise<unknown> {
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
  async remove(req: Request<RoleIdParamsDTO>): Promise<unknown> {
    const { roleId } = req.params;
    await this.deleteRoleUC.execute(new DeleteRoleCommand(roleId));
    return this.response({ message: 'Role deleted successfully' });
  }
}
