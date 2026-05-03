import { AdminGuard } from '@/presentation/http/express/guards/admin.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IPermissionController } from '@/presentation/http/express/v1/controllers/permission.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { validatePaginationQuery } from '@/presentation/http/express/v1/validators/pagination.validator';
import { IPermissionsValidator } from '@/presentation/http/express/v1/validators/permission.validator';

export class PermissionRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'permissions';

  constructor(
    private readonly permissionController: IPermissionController,
    private readonly permissionsValidator: IPermissionsValidator,
    private readonly authGuard: AuthGuard,
    private readonly adminGuard: AdminGuard,
    private readonly throttler: ThrottlerProxyGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { permissionIdParam, createBodyValidator, updateBodyValidator } = this.permissionsValidator;
    const authGuard = this.authGuard.handler;
    const requireAdmin = this.adminGuard.handler;
    const throttler = this.throttler.handler();

    this.router.get(
      '/',
      throttler,
      authGuard,
      requireAdmin,
      validatePaginationQuery,
      asyncHandler(this.permissionController.list)
    );
    this.router.post(
      '/',
      throttler,
      authGuard,
      requireAdmin,
      createBodyValidator,
      asyncHandler(this.permissionController.create)
    );
    this.router.get(
      '/:permissionId',
      throttler,
      authGuard,
      requireAdmin,
      permissionIdParam,
      asyncHandler(this.permissionController.getById)
    );
    this.router.put(
      '/:permissionId',
      throttler,
      authGuard,
      requireAdmin,
      permissionIdParam,
      updateBodyValidator,
      asyncHandler(this.permissionController.update)
    );
    this.router.delete(
      '/:permissionId',
      throttler,
      authGuard,
      requireAdmin,
      permissionIdParam,
      asyncHandler(this.permissionController.remove)
    );
  }
}
