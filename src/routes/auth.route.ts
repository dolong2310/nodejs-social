/*
 * This file defines the authentication routes for user signup, signin, token refresh, and logout.
 */

import { IAuthController } from '@/controllers/auth.controller';
import { protect } from '@/middlewares/auth.middleware';
import { authLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';
import { IAuthValidation } from '@/validations/auth.validation';
import { IUsersValidation } from '@/validations/users.validation';

export class AuthRoute extends BaseRoute {
  private authController!: IAuthController;
  private authValidation!: IAuthValidation;
  private usersValidation!: IUsersValidation;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    // Initialize the controller here, after the container is available
    this.authController = this.container.getAuthController();
    this.authValidation = this.container.getAuthValidation();
    this.usersValidation = this.container.getUsersValidation();

    this.router.post(
      '/register',
      authLimiter,
      this.authValidation.registerValidation,
      asyncHandler(this.authController.register)
    );
    this.router.post(
      '/login',
      authLimiter,
      this.authValidation.loginValidation,
      asyncHandler(this.authController.login)
    );
    this.router.post(
      '/logout',
      authLimiter,
      protect,
      this.authValidation.refreshTokenValidation,
      asyncHandler(this.authController.logout)
    );
    this.router.get(
      '/refresh-token',
      authLimiter,
      this.authValidation.refreshTokenValidation,
      asyncHandler(this.authController.refreshToken)
    );
    this.router.post(
      '/verify-email',
      authLimiter,
      this.authValidation.verifyEmailValidation,
      asyncHandler(this.authController.verifyEmail)
    );
    this.router.post('/resend-verify-email', authLimiter, protect, asyncHandler(this.authController.resendVerifyEmail));
    this.router.post(
      '/forgot-password',
      authLimiter,
      this.authValidation.forgotPasswordValidation,
      asyncHandler(this.authController.forgotPassword)
    );
    this.router.post(
      '/reset-password',
      authLimiter,
      this.authValidation.resetPasswordValidation,
      asyncHandler(this.authController.resetPassword)
    );
    this.router.put(
      '/change-password',
      authLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.authValidation.changePasswordValidation,
      asyncHandler(this.authController.changePassword)
    );
  }
}

export default () => {
  const authRoute = new AuthRoute();
  return authRoute.getRouter();
};
