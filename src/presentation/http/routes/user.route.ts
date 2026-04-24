import { IUserController } from '@/presentation/http/controllers/users.controller';
import { optionalProtect, protect } from '@/presentation/http/middlewares/auth.middleware';
import { appLimiter, authLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IUserValidator } from '@/presentation/http/validators/user.validator';

export class UserRoute extends BaseRoute {
  protected override readonly pathName = '/users';

  constructor(
    private readonly userController: IUserController,
    private readonly userValidator: IUserValidator
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { getMe, updateMe, getUserProfile, changePassword } = this.userController;
    const { userVerifiedValidator, updateMeValidator, changePasswordValidator } = this.userValidator;

    this.router.get('/me', appLimiter, protect, asyncHandler(getMe));
    this.router.patch('/me', appLimiter, protect, userVerifiedValidator, updateMeValidator, asyncHandler(updateMe));
    this.router.get('/:username', appLimiter, optionalProtect, asyncHandler(getUserProfile));
    this.router.put(
      '/change-password',
      authLimiter,
      protect,
      userVerifiedValidator,
      changePasswordValidator,
      asyncHandler(changePassword)
    );
  }
}
