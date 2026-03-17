import bookmarksController from '@/controllers/bookmarks.controller';
import { validateAccessToken } from '@/middlewares/auth.middleware';
import { validateCreateBookmark, validateDeleteBookmark } from '@/middlewares/bookmark.middleware';
import { checkUserVerified } from '@/middlewares/users.middleware';
import { asyncHandler } from '@/utils/handler.util';
import express from 'express';

const router = express.Router();

router.post(
  '/',
  validateAccessToken,
  checkUserVerified,
  validateCreateBookmark,
  asyncHandler(bookmarksController.createBookmark.bind(bookmarksController))
);
router.delete(
  '/posts/:postId',
  validateAccessToken,
  checkUserVerified,
  validateDeleteBookmark,
  asyncHandler(bookmarksController.deleteBookmark.bind(bookmarksController))
);

export default router;
