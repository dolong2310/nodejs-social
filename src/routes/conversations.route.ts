/*
 * Conversations: direct / group / messages / read / get / patch / invite / leave / kick / patch role / transfer admin.
 */

import { IChatMessagesController } from '@/controllers/chatMessages.controller';
import { IConversationsController } from '@/controllers/conversations.controller';
import { protect } from '@/middlewares/auth.middleware';
import { appLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';
import { IConversationsValidation } from '@/validations/conversations.validation';
import { IUsersValidation } from '@/validations/users.validation';

export class ConversationsRoute extends BaseRoute {
  private conversationsController!: IConversationsController;
  private chatMessagesController!: IChatMessagesController;
  private usersValidation!: IUsersValidation;
  private conversationsValidation!: IConversationsValidation;

  protected initializeRoutes(): void {
    this.conversationsController = this.container.getConversationsController();
    this.chatMessagesController = this.container.getChatMessagesController();
    this.usersValidation = this.container.getUsersValidation();
    this.conversationsValidation = this.container.getConversationsValidation();

    this.router.post(
      '/direct',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.conversationsValidation.peerUserIdBody,
      asyncHandler(this.conversationsController.createDirect)
    );

    this.router.post(
      '/groups',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.conversationsValidation.createGroupBody,
      asyncHandler(this.conversationsController.createGroup)
    );

    this.router.get(
      '/',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.conversationsValidation.listConversationsQuery,
      asyncHandler(this.conversationsController.listConversations)
    );

    this.router.get(
      '/:conversationId/messages',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.conversationsValidation.conversationIdParam,
      this.conversationsValidation.listMessagesQuery,
      asyncHandler(this.chatMessagesController.listMessages)
    );

    this.router.post(
      '/:conversationId/messages',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.conversationsValidation.conversationIdParam,
      this.conversationsValidation.sendMessageBody,
      asyncHandler(this.chatMessagesController.sendMessage)
    );

    this.router.patch(
      '/:conversationId/read',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.conversationsValidation.conversationIdParam,
      this.conversationsValidation.markReadBody,
      asyncHandler(this.chatMessagesController.markRead)
    );

    this.router.get(
      '/:conversationId',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.conversationsValidation.conversationIdParam,
      asyncHandler(this.conversationsController.getConversation)
    );

    this.router.patch(
      '/:conversationId',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.conversationsValidation.conversationIdParam,
      this.conversationsValidation.patchConversationBody,
      asyncHandler(this.conversationsController.patchConversation)
    );

    this.router.post(
      '/:conversationId/members',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.conversationsValidation.conversationIdParam,
      this.conversationsValidation.inviteUserIdBody,
      asyncHandler(this.conversationsController.inviteMember)
    );

    this.router.delete(
      '/:conversationId/members/me',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.conversationsValidation.conversationIdParam,
      asyncHandler(this.conversationsController.leaveConversation)
    );

    this.router.delete(
      '/:conversationId/members/:userId',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.conversationsValidation.conversationIdParam,
      this.conversationsValidation.kickTargetUserIdParam,
      asyncHandler(this.conversationsController.kickMember)
    );

    this.router.patch(
      '/:conversationId/members/:userId/role',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.conversationsValidation.conversationIdParam,
      this.conversationsValidation.kickTargetUserIdParam,
      this.conversationsValidation.patchMemberRoleBody,
      asyncHandler(this.conversationsController.patchMemberRole)
    );

    this.router.post(
      '/:conversationId/admin/transfer',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.conversationsValidation.conversationIdParam,
      this.conversationsValidation.newAdminUserIdBody,
      asyncHandler(this.conversationsController.transferAdmin)
    );
  }
}

export default () => {
  const r = new ConversationsRoute();
  return r.getRouter();
};
