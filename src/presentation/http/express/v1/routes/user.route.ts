import { AuthGuard } from '@/presentation/http/express/middlewares/auth.guard';
import { appLimiter, authLimiter } from '@/presentation/http/express/middlewares/limiter.middleware';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IUserController } from '@/presentation/http/express/v1/controllers/user.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class UserRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'users';

  constructor(
    private readonly userController: IUserController,
    private readonly userValidator: IUserValidator,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { getMe, updateMe, getUserProfile, changePassword } = this.userController;
    const { userActiveValidator, updateMeValidator, changePasswordValidator } = this.userValidator;
    const { protect, optionalProtect } = this.authGuard;

    this.router.get('/me', appLimiter, protect, userActiveValidator, asyncHandler(getMe));
    this.router.patch('/me', appLimiter, protect, userActiveValidator, updateMeValidator, asyncHandler(updateMe));
    this.router.get('/:username', appLimiter, optionalProtect, asyncHandler(getUserProfile));
    this.router.put(
      '/change-password',
      authLimiter,
      protect,
      userActiveValidator,
      changePasswordValidator,
      asyncHandler(changePassword)
    );
  }
}
