import authController from '@/controllers/auth.controller';
import {
  validateAccessToken,
  validateChangePassword,
  validateEmailVerificationToken,
  validateForgotPassword,
  validateForgotPasswordToken,
  validateLogin,
  validateRefreshToken,
  validateRegister
} from '@/middlewares/auth.middleware';
import { checkUserVerified } from '@/middlewares/users.middleware';
import { asyncHandler } from '@/utils/handler.util';
import express from 'express';

const router = express.Router();

router.post('/register', validateRegister, asyncHandler(authController.register.bind(authController)));
router.post('/login', validateLogin, asyncHandler(authController.login.bind(authController)));
router.post(
  '/logout',
  validateAccessToken,
  validateRefreshToken,
  asyncHandler(authController.logout.bind(authController))
);
router.post('/refresh-token', validateRefreshToken, asyncHandler(authController.refreshToken.bind(authController)));
router.post(
  '/verify-email',
  validateEmailVerificationToken,
  asyncHandler(authController.verifyEmail.bind(authController))
);
router.post(
  '/resend-verify-email',
  validateAccessToken,
  asyncHandler(authController.resendVerifyEmail.bind(authController))
);
router.post(
  '/forgot-password',
  validateForgotPassword,
  asyncHandler(authController.forgotPassword.bind(authController))
);
router.post(
  '/reset-password',
  validateForgotPasswordToken,
  asyncHandler(authController.resetPassword.bind(authController))
);
router.put(
  '/change-password',
  validateAccessToken,
  checkUserVerified,
  validateChangePassword,
  asyncHandler(authController.changePassword.bind(authController))
);

export default router;
