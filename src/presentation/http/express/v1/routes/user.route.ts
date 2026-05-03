import { THROTTLE } from '@/presentation/http/express/constants/throttler.constant';
import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
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
    private readonly authGuard: AuthGuard,
    private readonly authOptionGuard: AuthOptionGuard,
    private readonly throttler: ThrottlerProxyGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { getMe, updateMe, getUserProfile, changePassword } = this.userController;
    const { userActiveValidator, updateMeValidator, changePasswordValidator } = this.userValidator;
    const authGuard = this.authGuard.handler;
    const authOptionGuard = this.authOptionGuard.handler;
    const throttler = this.throttler.handler();
    const throttlerAuth = this.throttler.handler(THROTTLE.AUTH.WINDOW_MS, THROTTLE.AUTH.MAX);

    this.router.get('/me', throttler, authGuard, userActiveValidator, asyncHandler(getMe));
    this.router.patch('/me', throttler, authGuard, userActiveValidator, updateMeValidator, asyncHandler(updateMe));
    this.router.get('/:username', throttler, authOptionGuard, asyncHandler(getUserProfile));
    this.router.put(
      '/change-password',
      throttlerAuth,
      authGuard,
      userActiveValidator,
      changePasswordValidator,
      asyncHandler(changePassword)
    );
  }
}
