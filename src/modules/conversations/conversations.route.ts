import { protect } from '@/modules/auth/auth.middleware';
import { BaseRoute } from '@/modules/base/base.route';
import { ChatMessagesController } from '@/modules/chatMessages/chatMessages.controller';
import { ChatMessagesValidation } from '@/modules/chatMessages/chatMessages.validation';
import { ConversationsController } from '@/modules/conversations/conversations.controller';
import { ConversationsValidation } from '@/modules/conversations/conversations.validation';
import { UsersValidation } from '@/modules/users/users.validation';
import { validateCursorPaginationQuery } from '@/shared/middlewares/common.middleware';
import { appLimiter } from '@/shared/middlewares/limiter.middleware';
import { asyncHandler } from '@/utils/handler.util';

class ConversationsRoute extends BaseRoute {
  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    const {
      createDirect,
      createGroup,
      listConversations,
      getConversation,
      patchConversation,
      inviteMember,
      leaveConversation,
      kickMember,
      patchMemberRole,
      transferAdmin
    } = this.container.get(ConversationsController);
    const { listMessages, sendMessage, markRead } = this.container.get(ChatMessagesController);
    const { userVerifiedValidation } = this.container.get(UsersValidation);
    const {
      peerUserIdBody,
      createGroupBody,
      conversationIdParam,
      patchConversationBody,
      inviteUserIdBody,
      kickTargetUserIdParam,
      patchMemberRoleBody,
      newAdminUserIdBody
    } = this.container.get(ConversationsValidation);
    const { sendMessageBody, markReadBody } = this.container.get(ChatMessagesValidation);

    this.router.post(
      '/direct',
      appLimiter,
      protect,
      userVerifiedValidation,
      peerUserIdBody,
      asyncHandler(createDirect)
    );

    this.router.post(
      '/groups',
      appLimiter,
      protect,
      userVerifiedValidation,
      createGroupBody,
      asyncHandler(createGroup)
    );

    this.router.get(
      '/',
      appLimiter,
      protect,
      userVerifiedValidation,
      validateCursorPaginationQuery,
      asyncHandler(listConversations)
    );

    this.router.get(
      '/:conversationId',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      asyncHandler(getConversation)
    );

    this.router.patch(
      '/:conversationId',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      patchConversationBody,
      asyncHandler(patchConversation)
    );

    this.router.post(
      '/:conversationId/members',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      inviteUserIdBody,
      asyncHandler(inviteMember)
    );

    this.router.delete(
      '/:conversationId/members/me',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      asyncHandler(leaveConversation)
    );

    this.router.delete(
      '/:conversationId/members/:userId',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      kickTargetUserIdParam,
      asyncHandler(kickMember)
    );

    this.router.patch(
      '/:conversationId/members/:userId/role',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      kickTargetUserIdParam,
      patchMemberRoleBody,
      asyncHandler(patchMemberRole)
    );

    this.router.post(
      '/:conversationId/admin/transfer',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      newAdminUserIdBody,
      asyncHandler(transferAdmin)
    );

    // Chat Messages
    this.router.get(
      '/:conversationId/messages',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      validateCursorPaginationQuery,
      asyncHandler(listMessages)
    );

    this.router.post(
      '/:conversationId/messages',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      sendMessageBody,
      asyncHandler(sendMessage)
    );

    this.router.patch(
      '/:conversationId/read',
      appLimiter,
      protect,
      userVerifiedValidation,
      conversationIdParam,
      markReadBody,
      asyncHandler(markRead)
    );
  }
}

export function conversationsRouter() {
  return new ConversationsRoute().getRouter();
}
