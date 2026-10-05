import {
  AdminCreateUserInputPort,
  type AdminCreateUserPort
} from '@/modules/user/application/use-cases/admin-create-user/admin-create-user.port';
import {
  AdminDeleteUserInputPort,
  type AdminDeleteUserPort
} from '@/modules/user/application/use-cases/admin-delete-user/admin-delete-user.port';
import {
  type AdminGetUserPort,
  AdminGetUserInputPort
} from '@/modules/user/application/use-cases/admin-get-user/admin-get-user.port';
import {
  type AdminListUsersPort,
  AdminListUsersInputPort
} from '@/modules/user/application/use-cases/admin-list-users/admin-list-users.port';
import {
  AdminUpdateUserInputPort,
  type AdminUpdateUserPort
} from '@/modules/user/application/use-cases/admin-update-user/admin-update-user.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import type { ValidatedRequest } from '@/presentation/http/express/types';
import type {
  AdminCreateUserBodySchema,
  AdminUpdateUserBodySchema,
  AdminUserIdParamsSchema
} from '@/presentation/http/express/v1/schemas/admin-user/admin-user.request.schema';
import type { PaginationQuerySchema } from '@/presentation/http/express/v1/schemas/common/pagination.schema';

type ListUsersRequest = ValidatedRequest<{ query: typeof PaginationQuerySchema }>;
type CreateUserRequest = ValidatedRequest<{ body: typeof AdminCreateUserBodySchema }>;
type UserIdRequest = ValidatedRequest<{ params: typeof AdminUserIdParamsSchema }>;
type UpdateUserRequest = ValidatedRequest<{
  params: typeof AdminUserIdParamsSchema;
  body: typeof AdminUpdateUserBodySchema;
}>;

export interface IAdminUserController {
  list(req: ListUsersRequest): Promise<unknown>;
  create(req: CreateUserRequest): Promise<unknown>;
  getById(req: UserIdRequest): Promise<unknown>;
  update(req: UpdateUserRequest): Promise<unknown>;
  remove(req: UserIdRequest): Promise<unknown>;
}

@AutoBind()
export class AdminUserController extends BaseController implements IAdminUserController {
  constructor(
    private readonly listUsersUC: AdminListUsersPort,
    private readonly getUserUC: AdminGetUserPort,
    private readonly createUserUC: AdminCreateUserPort,
    private readonly updateUserUC: AdminUpdateUserPort,
    private readonly deleteUserUC: AdminDeleteUserPort
  ) {
    super();
  }

  async list(req: ListUsersRequest): Promise<unknown> {
    const { page, limit } = req.query;
    const { items, total } = await this.listUsersUC.execute(new AdminListUsersInputPort({ page, limit }));
    return this.paginatedResponse({
      data: items,
      pagination: { page, limit, totalItems: total },
      message: 'List users successfully'
    });
  }

  async create(req: CreateUserRequest): Promise<unknown> {
    const body = req.body;

    const item = await this.createUserUC.execute(
      new AdminCreateUserInputPort({
        actorId: this.getUserId(req),
        name: body.name,
        email: body.email,
        password: body.password,
        birthday: body.birthday,
        roleId: body.roleId,
        status: body.status,
        bio: body.bio,
        location: body.location,
        website: body.website,
        username: body.username,
        avatar: body.avatar,
        coverPhoto: body.coverPhoto
      })
    );

    return this.response({ instance: Created, data: item, message: 'User created successfully' });
  }

  async getById(req: UserIdRequest): Promise<unknown> {
    const { userId } = req.params;
    const item = await this.getUserUC.execute(new AdminGetUserInputPort(userId));
    return this.response({ data: item, message: 'Get user successfully' });
  }

  async update(req: UpdateUserRequest): Promise<unknown> {
    const { userId } = req.params;
    const body = req.body;

    const item = await this.updateUserUC.execute(
      new AdminUpdateUserInputPort({
        actorId: this.getUserId(req),
        userId,
        name: body.name,
        email: body.email,
        password: body.password,
        birthday: body.birthday,
        roleId: body.roleId,
        status: body.status,
        bio: body.bio,
        location: body.location,
        website: body.website,
        username: body.username,
        avatar: body.avatar,
        coverPhoto: body.coverPhoto
      })
    );

    return this.response({ data: item, message: 'User updated successfully' });
  }

  async remove(req: UserIdRequest): Promise<unknown> {
    const { userId } = req.params;
    await this.deleteUserUC.execute(new AdminDeleteUserInputPort({ actorId: this.getUserId(req), userId }));
    return this.response({ message: 'User deleted successfully' });
  }
}
