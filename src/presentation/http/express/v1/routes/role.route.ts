import { IRoleService } from '@/modules/role/application/services/role.service';
import { IUserService } from '@/modules/user/application/services/user.service';
import { requireAdmin } from '@/presentation/http/express/middlewares/admin.middleware';
import { AuthGuard } from '@/presentation/http/express/middlewares/auth.guard';
import { validatePaginationQuery } from '@/presentation/http/express/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/express/middlewares/limiter.middleware';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IRoleController } from '@/presentation/http/express/v1/controllers/role.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { IRolesValidator } from '@/presentation/http/express/v1/validators/role.validator';

export class RoleRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'roles';

  constructor(
    private readonly roleController: IRoleController,
    private readonly roleService: IRoleService,
    private readonly userService: IUserService,
    private readonly rolesValidator: IRolesValidator,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const admin = requireAdmin(this.roleService, this.userService);
    const roleIdParam = this.rolesValidator.roleIdParam();
    const createBodyValidator = this.rolesValidator.createBodyValidator();
    const updateBodyValidator = this.rolesValidator.updateBodyValidator();
    const { protect } = this.authGuard;

    this.router.get('/', appLimiter, protect, admin, validatePaginationQuery, asyncHandler(this.roleController.list));
    this.router.post('/', appLimiter, protect, admin, createBodyValidator, asyncHandler(this.roleController.create));
    this.router.get('/:roleId', appLimiter, protect, admin, roleIdParam, asyncHandler(this.roleController.getById));
    this.router.put(
      '/:roleId',
      appLimiter,
      protect,
      admin,
      roleIdParam,
      updateBodyValidator,
      asyncHandler(this.roleController.update)
    );
    this.router.delete('/:roleId', appLimiter, protect, admin, roleIdParam, asyncHandler(this.roleController.remove));
  }
}
