import { AdminGuard } from '@/presentation/http/express/guards/admin.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IRoleController } from '@/presentation/http/express/v1/controllers/role.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { validatePaginationQuery } from '@/presentation/http/express/v1/validators/pagination.validator';
import { IRolesValidator } from '@/presentation/http/express/v1/validators/role.validator';

export class RoleRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'roles';

  constructor(
    private readonly roleController: IRoleController,
    private readonly rolesValidator: IRolesValidator,
    private readonly authGuard: AuthGuard,
    private readonly adminGuard: AdminGuard,
    private readonly throttler: ThrottlerProxyGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const roleIdParam = this.rolesValidator.roleIdParam();
    const createBodyValidator = this.rolesValidator.createBodyValidator();
    const updateBodyValidator = this.rolesValidator.updateBodyValidator();
    const authGuard = this.authGuard.handler;
    const requireAdmin = this.adminGuard.handler;
    const throttler = this.throttler.handler();

    this.router.get(
      '/',
      throttler,
      authGuard,
      requireAdmin,
      validatePaginationQuery,
      asyncHandler(this.roleController.list)
    );
    this.router.post(
      '/',
      throttler,
      authGuard,
      requireAdmin,
      createBodyValidator,
      asyncHandler(this.roleController.create)
    );
    this.router.get(
      '/:roleId',
      throttler,
      authGuard,
      requireAdmin,
      roleIdParam,
      asyncHandler(this.roleController.getById)
    );
    this.router.put(
      '/:roleId',
      throttler,
      authGuard,
      requireAdmin,
      roleIdParam,
      updateBodyValidator,
      asyncHandler(this.roleController.update)
    );
    this.router.delete(
      '/:roleId',
      throttler,
      authGuard,
      requireAdmin,
      roleIdParam,
      asyncHandler(this.roleController.remove)
    );
  }
}
