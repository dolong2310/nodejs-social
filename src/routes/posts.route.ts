import postsController from '@/controllers/posts.controller';
import { checkAuthWrapper, validateAccessToken } from '@/middlewares/auth.middleware';
import {
  validateAudience,
  validateCreatePost,
  validatePaginationQuery,
  validatePostId,
  validatePostType
} from '@/middlewares/posts.middleware';
import { checkUserVerified } from '@/middlewares/users.middleware';
import { asyncHandler } from '@/utils/handler.util';
import express from 'express';

const router = express.Router();

router.get(
  '/',
  checkAuthWrapper(validateAccessToken),
  checkAuthWrapper(checkUserVerified),
  validatePaginationQuery,
  asyncHandler(postsController.getNewFeeds.bind(postsController))
);
router.get(
  '/:postId',
  checkAuthWrapper(validateAccessToken),
  checkAuthWrapper(checkUserVerified),
  validatePostId,
  validateAudience,
  asyncHandler(postsController.getPostDetail.bind(postsController))
);
router.get(
  '/:type/:postId',
  checkAuthWrapper(validateAccessToken),
  checkAuthWrapper(checkUserVerified),
  validatePostId,
  validateAudience,
  validatePostType,
  validatePaginationQuery,
  asyncHandler(postsController.getPostsType.bind(postsController))
);
router.post(
  '/',
  validateAccessToken,
  checkUserVerified,
  validateCreatePost,
  asyncHandler(postsController.createPost.bind(postsController))
);

export default router;
