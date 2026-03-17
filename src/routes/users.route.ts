import userController from '@/controllers/users.controller';
import { filterBodyMiddleware } from '@/middlewares/common.middleware';
import { checkUserVerified } from '@/middlewares/users.middleware';
import { validateAccessToken } from '@/middlewares/auth.middleware';
import { IUpdateMeRequestBody } from '@/models/requests/user.request';
import { asyncHandler } from '@/utils/handler.util';
import express from 'express';

const router = express.Router();

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
