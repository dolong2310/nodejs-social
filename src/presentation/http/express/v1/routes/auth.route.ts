import { THROTTLE } from '@/presentation/http/express/constants/throttler.constant';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IAuthController } from '@/presentation/http/express/v1/controllers/auth.controller';
import { IAuthPipe } from '@/presentation/http/express/v1/pipes/auth.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class AuthRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'auth';

  constructor(
    private readonly authController: IAuthController,
    private readonly authPipe: IAuthPipe,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { register, login, logout, refreshToken, forgotPassword, sendOtp, enable2fa, disable2fa } =
      this.authController;
    const { registerPipe, loginPipe, forgotPasswordPipe, sendOtpPipe, disable2faPipe } = this.authPipe;
    const authGuard = this.authGuard.handler;
    const throttler = this.throttlerGuard(THROTTLE.AUTH.WINDOW_MS, THROTTLE.AUTH.MAX);

    this.router.post('/register', throttler, registerPipe, asyncHandler(this.transformInterceptor(register)));
    this.router.post('/login', throttler, loginPipe, asyncHandler(this.transformInterceptor(login)));
    this.router.post('/logout', throttler, authGuard, asyncHandler(this.transformInterceptor(logout)));
    this.router.get('/refresh-token', throttler, asyncHandler(this.transformInterceptor(refreshToken)));
    this.router.post(
      '/forgot-password',
      throttler,
      forgotPasswordPipe,
      asyncHandler(this.transformInterceptor(forgotPassword))
    );
    this.router.post('/otp', throttler, sendOtpPipe, asyncHandler(this.transformInterceptor(sendOtp)));
    this.router.post('/2fa/enable', throttler, authGuard, asyncHandler(this.transformInterceptor(enable2fa)));
    this.router.post(
      '/2fa/disable',
      throttler,
      authGuard,
      disable2faPipe,
      asyncHandler(this.transformInterceptor(disable2fa))
    );
  }
}
