import { THROTTLE } from '@/presentation/http/express/constants/throttler.constant';
import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IUserController } from '@/presentation/http/express/v1/controllers/user.controller';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class UserRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'users';

  constructor(
    private readonly userController: IUserController,
    private readonly userPipe: IUserPipe,
    private readonly authGuard: AuthGuard,
    private readonly authOptionGuard: AuthOptionGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { getMe, updateMe, getUserProfile, changePassword } = this.userController;
    const { userActivePipe, updateMePipe, changePasswordPipe } = this.userPipe;
    const authGuard = this.authGuard.handler;
    const authOptionGuard = this.authOptionGuard.handler;
    const throttler = this.throttlerGuard();
    const throttlerAuth = this.throttlerGuard(THROTTLE.AUTH.WINDOW_MS, THROTTLE.AUTH.MAX);

    this.router.get('/me', throttler, authGuard, userActivePipe, asyncHandler(this.transformInterceptor(getMe)));
    this.router.patch(
      '/me',
      throttler,
      authGuard,
      userActivePipe,
      updateMePipe,
      asyncHandler(this.transformInterceptor(updateMe))
    );
    this.router.get('/:username', throttler, authOptionGuard, asyncHandler(this.transformInterceptor(getUserProfile)));
    this.router.put(
      '/change-password',
      throttlerAuth,
      authGuard,
      userActivePipe,
      changePasswordPipe,
      asyncHandler(this.transformInterceptor(changePassword))
    );
  }
}
