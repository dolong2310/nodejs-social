import {
  CreateRoleInputPort,
  type CreateRolePort
} from '@/modules/authorization/application/use-cases/create-role/create-role.port';
import {
  DeleteRoleInputPort,
  type DeleteRolePort
} from '@/modules/authorization/application/use-cases/delete-role/delete-role.port';
import {
  type GetRolePort,
  GetRoleInputPort
} from '@/modules/authorization/application/use-cases/get-role/get-role.port';
import {
  type ListRolesPort,
  ListRolesInputPort
} from '@/modules/authorization/application/use-cases/list-roles/list-roles.port';
import {
  UpdateRoleInputPort,
  type UpdateRolePort
} from '@/modules/authorization/application/use-cases/update-role/update-role.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import type { ValidatedRequest } from '@/presentation/http/express/types';
import type { PaginationQuerySchema } from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import type {
  CreateRoleBodySchema,
  RoleIdParamsSchema,
  UpdateRoleBodySchema
} from '@/presentation/http/express/v1/schemas/role/role.request.schema';
import type { RoleResponse } from '@/presentation/http/express/v1/schemas/role/role.response.schema';

type ListRolesRequest = ValidatedRequest<{ query: typeof PaginationQuerySchema }>;
type CreateRoleRequest = ValidatedRequest<{ body: typeof CreateRoleBodySchema }>;
type RoleIdRequest = ValidatedRequest<{ params: typeof RoleIdParamsSchema }>;
type UpdateRoleRequest = ValidatedRequest<{ params: typeof RoleIdParamsSchema; body: typeof UpdateRoleBodySchema }>;

export interface IRoleController {
  list(req: ListRolesRequest): Promise<unknown>;
  create(req: CreateRoleRequest): Promise<unknown>;
  getById(req: RoleIdRequest): Promise<unknown>;
  update(req: UpdateRoleRequest): Promise<unknown>;
  remove(req: RoleIdRequest): Promise<unknown>;
}

@AutoBind()
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

  async list(req: ListRolesRequest): Promise<unknown> {
    const { page, limit } = req.query;
    const { items, total } = await this.listRolesUC.execute(new ListRolesInputPort({ page, limit }));
    return this.paginatedResponse<RoleResponse[]>({
      data: items,
      pagination: { page, limit, totalItems: total },
      message: 'List roles successfully'
    });
  }

  async create(req: CreateRoleRequest): Promise<unknown> {
    const body = req.body;
    const item = await this.createRoleUC.execute(
      new CreateRoleInputPort({
        name: body.name,
        description: body.description,
        isActive: body.isActive,
        permissionIds: body.permissionIds
      })
    );
    return this.response<RoleResponse>({ instance: Created, data: item, message: 'Role created successfully' });
  }

  async getById(req: RoleIdRequest): Promise<unknown> {
    const { roleId } = req.params;
    const item = await this.getRoleUC.execute(new GetRoleInputPort(roleId));
    return this.response<RoleResponse>({ data: item, message: 'Get role successfully' });
  }

  async update(req: UpdateRoleRequest): Promise<unknown> {
    const { roleId } = req.params;
    const body = req.body;
    const item = await this.updateRoleUC.execute(
      new UpdateRoleInputPort({
        id: roleId,
        name: body.name,
        description: body.description,
        isActive: body.isActive,
        permissionIds: body.permissionIds
      })
    );
    return this.response<RoleResponse>({ data: item, message: 'Role updated successfully' });
  }

  async remove(req: RoleIdRequest): Promise<unknown> {
    const { roleId } = req.params;
    await this.deleteRoleUC.execute(new DeleteRoleInputPort({ id: roleId, actorId: this.getUserId(req) }));
    return this.response({ message: 'Role deleted successfully' });
  }
}
