/*
 * This file defines the authentication routes for user signup, signin, token refresh, and logout.
 */

import { AuthController, AuthValidation, BaseRoute, UsersValidation, protect } from '@/modules';
import { authLimiter } from '@/shared';
import { asyncHandler } from '@/utils';

class AuthRoute extends BaseRoute {
  constructor() {
    super();
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
    } = this.container.get(AuthController);
    const {
      registerValidation,
      loginValidation,
      refreshTokenValidation,
      verifyEmailValidation,
      forgotPasswordValidation,
      resetPasswordValidation,
      changePasswordValidation
    } = this.container.get(AuthValidation);
    const { userVerifiedValidation } = this.container.get(UsersValidation);

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

export function authRouter() {
  return new AuthRoute().getRouter();
}
