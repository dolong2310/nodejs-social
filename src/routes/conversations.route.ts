/*
 * This file defines the conversations routes for creating conversation, getting conversations.
 */

import { IConversationsController } from '@/controllers/conversations.controller';
import { protect } from '@/middlewares/auth.middleware';
import { validatePaginationQuery } from '@/middlewares/common.middleware';
import { appLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';
import { IUsersValidation } from '@/validations/users.validation';

export class ConversationsRoute extends BaseRoute {
  private conversationsController!: IConversationsController;
  private usersValidation!: IUsersValidation;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    // Initialize the controller here, after the container is available
    this.conversationsController = this.container.getConversationsController();
    this.usersValidation = this.container.getUsersValidation();

    this.router.post(
      '/',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      asyncHandler(this.conversationsController.createConversation)
    );

    this.router.get(
      '/receivers/:receiverId',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.usersValidation.userIdValidation('receiverId', 'params'),
      validatePaginationQuery,
      asyncHandler(this.conversationsController.getConversations)
    );
  }
}

export default () => {
  const conversationsRoute = new ConversationsRoute();
  return conversationsRoute.getRouter();
};
