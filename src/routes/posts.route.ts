import postsController from '@/controllers/posts.controller';
import { checkAuthWrapper } from '@/middlewares/auth.middleware';
import { validateAudience, validateCreatePost, validatePostId } from '@/middlewares/posts.middleware';
import { checkUserVerified, validateAccessToken } from '@/middlewares/users.middleware';
import { asyncHandler } from '@/utils/handler.util';
import express from 'express';

const router = express.Router();

// router.get('/', validateAccessToken, checkUserVerified, asyncHandler(postsController.getPosts.bind(postsController)));
router.get(
  '/:postId',
  checkAuthWrapper(validateAccessToken),
  checkAuthWrapper(checkUserVerified),
  validatePostId,
  validateAudience,
  asyncHandler(postsController.getPostDetail.bind(postsController))
);
router.post(
  '/',
  validateAccessToken,
  checkUserVerified,
  validateCreatePost,
  asyncHandler(postsController.createPost.bind(postsController))
);

export default router;
