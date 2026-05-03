import { THROTTLE } from '@/presentation/http/express/constants/throttler.constant';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IAuthController } from '@/presentation/http/express/v1/controllers/auth.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { IAuthValidator } from '@/presentation/http/express/v1/validators/auth.validator';

export class AuthRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'auth';

  constructor(
    private readonly authController: IAuthController,
    private readonly authValidator: IAuthValidator,
    private readonly authGuard: AuthGuard,
    private readonly throttler: ThrottlerProxyGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { register, login, logout, refreshToken, forgotPassword, sendOtp, enable2fa, disable2fa } =
      this.authController;
    const { registerValidator, loginValidator, forgotPasswordValidator, sendOtpValidator, disable2faValidator } =
      this.authValidator;
    const authGuard = this.authGuard.handler;
    const throttler = this.throttler.handler(THROTTLE.AUTH.WINDOW_MS, THROTTLE.AUTH.MAX);

    this.router.post('/register', throttler, registerValidator, asyncHandler(register));
    this.router.post('/login', throttler, loginValidator, asyncHandler(login));
    this.router.post('/logout', throttler, authGuard, asyncHandler(logout));
    this.router.get('/refresh-token', throttler, asyncHandler(refreshToken));
    this.router.post('/forgot-password', throttler, forgotPasswordValidator, asyncHandler(forgotPassword));
    this.router.post('/otp', throttler, sendOtpValidator, asyncHandler(sendOtp));
    this.router.post('/2fa/enable', throttler, authGuard, asyncHandler(enable2fa));
    this.router.post('/2fa/disable', throttler, authGuard, disable2faValidator, asyncHandler(disable2fa));
  }
}
