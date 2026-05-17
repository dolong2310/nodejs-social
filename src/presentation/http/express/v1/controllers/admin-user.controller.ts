import {
  AdminCreateUserCommand,
  AdminCreateUserPort
} from '@/modules/user/application/use-cases/admin-create-user/admin-create-user.port';
import {
  AdminDeleteUserCommand,
  AdminDeleteUserPort
} from '@/modules/user/application/use-cases/admin-delete-user/admin-delete-user.port';
import {
  AdminGetUserPort,
  AdminGetUserQuery
} from '@/modules/user/application/use-cases/admin-get-user/admin-get-user.port';
import {
  AdminListUsersPort,
  AdminListUsersQuery
} from '@/modules/user/application/use-cases/admin-list-users/admin-list-users.port';
import {
  AdminUpdateUserCommand,
  AdminUpdateUserPort
} from '@/modules/user/application/use-cases/admin-update-user/admin-update-user.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { Created } from '@/presentation/http/express/responses/success.response';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import { PaginationQueryDTO } from '@/presentation/http/express/v1/dtos/common/common.request.dto';
import {
  AdminCreateUserRequestBody,
  AdminCreateUserRequestDTO,
  AdminUpdateUserRequestBody,
  AdminUpdateUserRequestDTO,
  AdminUserIdParamsDTO
} from '@/presentation/http/express/v1/dtos/user/admin-user.request.dto';
import { UserResponseDTO } from '@/presentation/http/express/v1/dtos/user/user.response.dto';
import { NextFunction } from 'express';
import { ParamsDictionary } from 'express-serve-static-core';

export interface IAdminUserController {
  list(
    req: ExpressRequest<ParamsDictionary, object, object, PaginationQueryDTO>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  create(
    req: ExpressRequest<ParamsDictionary, object, AdminCreateUserRequestBody>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  getById(req: ExpressRequest<AdminUserIdParamsDTO>, res: ExpressResponse, next: NextFunction): Promise<unknown>;
  update(
    req: ExpressRequest<AdminUserIdParamsDTO, object, AdminUpdateUserRequestBody>,
    res: ExpressResponse,
    next: NextFunction
  ): Promise<unknown>;
  remove(req: ExpressRequest<AdminUserIdParamsDTO>, res: ExpressResponse, next: NextFunction): Promise<unknown>;
}

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

  @AutoBind()
  async list(req: ExpressRequest<ParamsDictionary, object, object, PaginationQueryDTO>): Promise<unknown> {
    const page = Number(req.query.page);
    const limit = Number(req.query.limit);
    const { items, total } = await this.listUsersUC.execute(new AdminListUsersQuery({ page, limit }));
    return this.paginatedResponse({
      data: items.map((item) => new UserResponseDTO(item)),
      pagination: { page, limit, totalItems: total },
      message: 'List users successfully'
    });
  }

  @AutoBind()
  async create(req: ExpressRequest<ParamsDictionary, object, AdminCreateUserRequestBody>): Promise<unknown> {
    const dto = new AdminCreateUserRequestDTO(req.body);
    const item = await this.createUserUC.execute(
      new AdminCreateUserCommand({
        actorId: this.getUserId(req),
        name: dto.name,
        email: dto.email,
        password: dto.password,
        birthday: dto.birthday,
        roleId: dto.roleId,
        status: dto.status,
        bio: dto.bio,
        location: dto.location,
        website: dto.website,
        username: dto.username,
        avatar: dto.avatar,
        coverPhoto: dto.coverPhoto
      })
    );

    return this.response({
      instance: Created,
      data: new UserResponseDTO(item),
      message: 'User created successfully'
    });
  }

  @AutoBind()
  async getById(req: ExpressRequest<AdminUserIdParamsDTO>): Promise<unknown> {
    const { userId } = req.params;
    const item = await this.getUserUC.execute(new AdminGetUserQuery(userId));
    return this.response({ data: new UserResponseDTO(item), message: 'Get user successfully' });
  }

  @AutoBind()
  async update(req: ExpressRequest<AdminUserIdParamsDTO, object, AdminUpdateUserRequestBody>): Promise<unknown> {
    const { userId } = req.params;
    const dto = new AdminUpdateUserRequestDTO(req.body);
    const item = await this.updateUserUC.execute(
      new AdminUpdateUserCommand({
        actorId: this.getUserId(req),
        userId,
        name: dto.name,
        email: dto.email,
        password: dto.password,
        birthday: dto.birthday,
        roleId: dto.roleId,
        status: dto.status,
        bio: dto.bio,
        location: dto.location,
        website: dto.website,
        username: dto.username,
        avatar: dto.avatar,
        coverPhoto: dto.coverPhoto
      })
    );

    return this.response({ data: new UserResponseDTO(item), message: 'User updated successfully' });
  }

  @AutoBind()
  async remove(req: ExpressRequest<AdminUserIdParamsDTO>): Promise<unknown> {
    const { userId } = req.params;
    await this.deleteUserUC.execute(new AdminDeleteUserCommand({ actorId: this.getUserId(req), userId }));
    return this.response({ message: 'User deleted successfully' });
  }
}
