import userController from '@/controllers/users.controller';
import { filterBodyMiddleware } from '@/middlewares/common.middleware';
import {
  checkUserVerified,
  validateAccessToken,
  validateChangePassword,
  validateEmailVerificationToken,
  validateFollowUser,
  validateForgotPassword,
  validateForgotPasswordToken,
  validateLogin,
  validateRefreshToken,
  validateRegister,
  validateUnfollowUser
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
router.post(
  '/follow',
  validateAccessToken,
  checkUserVerified,
  validateFollowUser,
  asyncHandler(userController.followUser.bind(userController))
);
router.delete(
  '/follow/:userId',
  validateAccessToken,
  checkUserVerified,
  validateUnfollowUser,
  asyncHandler(userController.unfollowUser.bind(userController))
);

export default router;
