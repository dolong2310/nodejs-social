import { IAuthController } from '@/presentation/http/controllers/auth.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { authLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IAuthValidation } from '@/presentation/http/validators/auth.validator';
import { IUsersValidation } from '@/presentation/http/validators/users.validator';

export class AuthRoute extends BaseRoute {
  constructor(
    private readonly authController: IAuthController,
    private readonly authValidation: IAuthValidation,
    private readonly usersValidation: IUsersValidation
  ) {
    super('/auth');
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    const {
      register,
      login,
      logout,
      refreshToken,
      verifyEmail,
      resendVerifyEmail,
      forgotPassword,
      resetPassword,
      changePassword
    } = this.authController;
    const {
      registerValidation,
      loginValidation,
      refreshTokenValidation,
      verifyEmailValidation,
      forgotPasswordValidation,
      resetPasswordValidation,
      changePasswordValidation
    } = this.authValidation;
    const { userVerifiedValidation } = this.usersValidation;

    this.router.post('/register', authLimiter, registerValidation, asyncHandler(register));
    this.router.post('/login', authLimiter, loginValidation, asyncHandler(login));
    this.router.post('/logout', authLimiter, protect, refreshTokenValidation, asyncHandler(logout));
    this.router.get('/refresh-token', authLimiter, refreshTokenValidation, asyncHandler(refreshToken));
    this.router.post('/verify-email', authLimiter, verifyEmailValidation, asyncHandler(verifyEmail));
    this.router.post('/resend-verify-email', authLimiter, protect, asyncHandler(resendVerifyEmail));
    this.router.post('/forgot-password', authLimiter, forgotPasswordValidation, asyncHandler(forgotPassword));
    this.router.post('/reset-password', authLimiter, resetPasswordValidation, asyncHandler(resetPassword));
    this.router.put(
      '/change-password',
      authLimiter,
      protect,
      userVerifiedValidation,
      changePasswordValidation,
      asyncHandler(changePassword)
    );
  }
}
