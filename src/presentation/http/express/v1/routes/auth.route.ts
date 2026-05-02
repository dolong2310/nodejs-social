import { AuthGuard } from '@/presentation/http/express/middlewares/auth.guard';
import { authLimiter } from '@/presentation/http/express/middlewares/limiter.middleware';
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
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { register, login, logout, refreshToken, forgotPassword, sendOtp, enable2fa, disable2fa } =
      this.authController;
    const { registerValidator, loginValidator, forgotPasswordValidator, sendOtpValidator, disable2faValidator } =
      this.authValidator;
    const { protect } = this.authGuard;

    this.router.post('/register', authLimiter, registerValidator, asyncHandler(register));
    this.router.post('/login', authLimiter, loginValidator, asyncHandler(login));
    this.router.post('/logout', authLimiter, protect, asyncHandler(logout));
    this.router.get('/refresh-token', authLimiter, asyncHandler(refreshToken));
    this.router.post('/forgot-password', authLimiter, forgotPasswordValidator, asyncHandler(forgotPassword));
    this.router.post('/otp', authLimiter, sendOtpValidator, asyncHandler(sendOtp));
    this.router.post('/2fa/enable', authLimiter, protect, asyncHandler(enable2fa));
    this.router.post('/2fa/disable', authLimiter, protect, disable2faValidator, asyncHandler(disable2fa));
  }
}
