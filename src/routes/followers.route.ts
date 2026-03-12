import followersController from '@/controllers/followers.controller';
import { validateFollowUser, validateUnfollowUser } from '@/middlewares/followers.middleware';
import { checkUserVerified, validateAccessToken } from '@/middlewares/users.middleware';
import { asyncHandler } from '@/utils/handler.util';
import express from 'express';

const router = express.Router();

router.get('/', asyncHandler(followersController.getFollowers.bind(followersController)));

router.post(
  '/follow',
  validateAccessToken,
  checkUserVerified,
  validateFollowUser,
  asyncHandler(followersController.followUser.bind(followersController))
);
router.delete(
  '/follow/:userId',
  validateAccessToken,
  checkUserVerified,
  validateUnfollowUser,
  asyncHandler(followersController.unfollowUser.bind(followersController))
);

export default router;
