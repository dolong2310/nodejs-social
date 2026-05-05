import { THROTTLE } from '@/presentation/http/express/constants/throttler.constant';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
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

    this.router.post('/register', throttler, registerPipe, this.interceptor(register));
    this.router.post('/login', throttler, loginPipe, this.interceptor(login));
    this.router.post('/logout', throttler, authGuard, this.interceptor(logout));
    this.router.get('/refresh-token', throttler, this.interceptor(refreshToken));
    this.router.post('/forgot-password', throttler, forgotPasswordPipe, this.interceptor(forgotPassword));
    this.router.post('/otp', throttler, sendOtpPipe, this.interceptor(sendOtp));
    this.router.post('/2fa/enable', throttler, authGuard, this.interceptor(enable2fa));
    this.router.post('/2fa/disable', throttler, authGuard, disable2faPipe, this.interceptor(disable2fa));
  }
}
