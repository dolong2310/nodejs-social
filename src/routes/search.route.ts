import searchController from '@/controllers/search.controller';
import { checkAuthWrapper } from '@/middlewares/auth.middleware';
import { validatePaginationQuery } from '@/middlewares/posts.middleware';
import { validateSearchQuery } from '@/middlewares/search.middleware';
import { validateAccessToken } from '@/middlewares/users.middleware';
import { asyncHandler } from '@/utils/handler.util';
import express from 'express';

const router = express.Router();

router.get(
  '/',
  checkAuthWrapper(validateAccessToken),
  validateSearchQuery,
  validatePaginationQuery,
  asyncHandler(searchController.search.bind(searchController))
);

export default router;
