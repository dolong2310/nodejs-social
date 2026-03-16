import conversationsController from '@/controllers/conversations.controller';
import { validateReceiverId } from '@/middlewares/conversations.middleware';
import { validatePaginationQuery } from '@/middlewares/posts.middleware';
import { checkUserVerified, validateAccessToken } from '@/middlewares/users.middleware';
import { asyncHandler } from '@/utils/handler.util';
import express from 'express';

const router = express.Router();

router.get(
  '/receivers/:receiverId',
  validateAccessToken,
  checkUserVerified,
  validateReceiverId,
  validatePaginationQuery,
  asyncHandler(conversationsController.getConversations.bind(conversationsController))
);

export default router;
