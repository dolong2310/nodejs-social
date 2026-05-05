import { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IRoleController } from '@/presentation/http/express/v1/controllers/role.controller';
import { validatePaginationQuery } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IRolesPipe } from '@/presentation/http/express/v1/pipes/role.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class RoleRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'roles';

  constructor(
    private readonly roleController: IRoleController,
    private readonly rolesPipe: IRolesPipe,
    private readonly authGuard: AuthGuard,
    private readonly apiKeyGuard: ApiKeyGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { roleIdParam, createBodyPipe, updateBodyPipe } = this.rolesPipe;
    const { list, create, getById, update, remove } = this.roleController;
    const authGuard = this.authGuard.handler;
    const apiKeyGuard = this.apiKeyGuard.handler;
    const throttler = this.throttlerGuard();

    this.router.get(
      '/',
      throttler,
      authGuard,
      apiKeyGuard,
      validatePaginationQuery,
      asyncHandler(this.transformInterceptor(list))
    );
    this.router.post(
      '/',
      throttler,
      authGuard,
      apiKeyGuard,
      createBodyPipe,
      asyncHandler(this.transformInterceptor(create))
    );
    this.router.get(
      '/:roleId',
      throttler,
      authGuard,
      apiKeyGuard,
      roleIdParam,
      asyncHandler(this.transformInterceptor(getById))
    );
    this.router.put(
      '/:roleId',
      throttler,
      authGuard,
      apiKeyGuard,
      roleIdParam,
      updateBodyPipe,
      asyncHandler(this.transformInterceptor(update))
    );
    this.router.delete(
      '/:roleId',
      throttler,
      authGuard,
      apiKeyGuard,
      roleIdParam,
      asyncHandler(this.transformInterceptor(remove))
    );
  }
}
