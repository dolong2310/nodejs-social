import { IAuthController } from '@/presentation/http/controllers/auth.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { authLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IAuthValidator } from '@/presentation/http/validators/auth.validator';

export class AuthRoute extends BaseRoute {
  protected override readonly pathName = '/auth';

  constructor(
    private readonly authController: IAuthController,
    private readonly authValidator: IAuthValidator
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { register, login, logout, refreshToken, forgotPassword } = this.authController;
    const { registerValidator, loginValidator, forgotPasswordValidator } = this.authValidator;

    this.router.post('/register', authLimiter, registerValidator, asyncHandler(register));
    this.router.post('/login', authLimiter, loginValidator, asyncHandler(login));
    this.router.post('/logout', authLimiter, protect, asyncHandler(logout));
    this.router.get('/refresh-token', authLimiter, asyncHandler(refreshToken));
    this.router.post('/forgot-password', authLimiter, forgotPasswordValidator, asyncHandler(forgotPassword));
  }
}
