import { IRoleService } from '@/modules/role/application/services/role.service';
import { IUserService } from '@/modules/user/application/services/user.service';
import { requireAdmin } from '@/presentation/http/express/middlewares/admin.middleware';
import { AuthGuard } from '@/presentation/http/express/middlewares/auth.guard';
import { validatePaginationQuery } from '@/presentation/http/express/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/express/middlewares/limiter.middleware';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IPermissionController } from '@/presentation/http/express/v1/controllers/permission.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { IPermissionsValidator } from '@/presentation/http/express/v1/validators/permission.validator';

export class PermissionRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'permissions';

  constructor(
    private readonly permissionController: IPermissionController,
    private readonly roleService: IRoleService,
    private readonly userService: IUserService,
    private readonly permissionsValidator: IPermissionsValidator,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const admin = requireAdmin(this.roleService, this.userService);
    const { permissionIdParam, createBodyValidator, updateBodyValidator } = this.permissionsValidator;
    const { protect } = this.authGuard;

    this.router.get(
      '/',
      appLimiter,
      protect,
      admin,
      validatePaginationQuery,
      asyncHandler(this.permissionController.list)
    );
    this.router.post(
      '/',
      appLimiter,
      protect,
      admin,
      createBodyValidator,
      asyncHandler(this.permissionController.create)
    );
    this.router.get(
      '/:permissionId',
      appLimiter,
      protect,
      admin,
      permissionIdParam,
      asyncHandler(this.permissionController.getById)
    );
    this.router.put(
      '/:permissionId',
      appLimiter,
      protect,
      admin,
      permissionIdParam,
      updateBodyValidator,
      asyncHandler(this.permissionController.update)
    );
    this.router.delete(
      '/:permissionId',
      appLimiter,
      protect,
      admin,
      permissionIdParam,
      asyncHandler(this.permissionController.remove)
    );
  }
}
