import followersController from '@/controllers/followers.controller';
import { validateAccessToken } from '@/middlewares/auth.middleware';
import { validateFollowUser, validateUnfollowUser } from '@/middlewares/followers.middleware';
import { checkUserVerified } from '@/middlewares/users.middleware';
import { asyncHandler } from '@/utils/handler.util';
import express from 'express';

const router = express.Router();

router.post(
  '/',
  validateAccessToken,
  checkUserVerified,
  validateFollowUser,
  asyncHandler(followersController.followUser.bind(followersController))
);
router.delete(
  '/:userId',
  validateAccessToken,
  checkUserVerified,
  validateUnfollowUser,
  asyncHandler(followersController.unfollowUser.bind(followersController))
);

export default router;
