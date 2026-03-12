import userController from '@/controllers/users.controller';
import { filterBodyMiddleware } from '@/middlewares/common.middleware';
import {
  checkUserVerified,
  validateAccessToken,
  validateChangePassword,
  validateEmailVerificationToken,
  validateForgotPassword,
  validateForgotPasswordToken,
  validateLogin,
  validateRefreshToken,
  validateRegister
} from '@/middlewares/users.middleware';
import { IUpdateMeRequestBody } from '@/models/requests/user.request';
import { asyncHandler } from '@/utils/handler.util';
import express from 'express';

const router = express.Router();

router.post('/register', validateRegister, asyncHandler(userController.register.bind(userController)));
router.post('/login', validateLogin, asyncHandler(userController.login.bind(userController)));
router.post(
  '/logout',
  validateAccessToken,
  validateRefreshToken,
  asyncHandler(userController.logout.bind(userController))
);
router.post('/refresh-token', validateRefreshToken, asyncHandler(userController.refreshToken.bind(userController)));
router.post(
  '/verify-email',
  validateEmailVerificationToken,
  asyncHandler(userController.verifyEmail.bind(userController))
);
router.post(
  '/resend-verify-email',
  validateAccessToken,
  asyncHandler(userController.resendVerifyEmail.bind(userController))
);
router.post(
  '/forgot-password',
  validateForgotPassword,
  asyncHandler(userController.forgotPassword.bind(userController))
);
router.post(
  '/reset-password',
  validateForgotPasswordToken,
  asyncHandler(userController.resetPassword.bind(userController))
);
router.put(
  '/change-password',
  validateAccessToken,
  checkUserVerified,
  validateChangePassword,
  asyncHandler(userController.changePassword.bind(userController))
);
router.get('/me', validateAccessToken, asyncHandler(userController.getMe.bind(userController)));
router.patch(
  '/me',
  validateAccessToken,
  checkUserVerified,
  filterBodyMiddleware<IUpdateMeRequestBody>([
    'name',
    'dateOfBirth',
    'bio',
    'location',
    'website',
    'username',
    'avatar',
    'coverPhoto'
  ]),
  asyncHandler(userController.updateMe.bind(userController))
);
router.get('/:username', asyncHandler(userController.getUserProfile.bind(userController)));

export default router;
