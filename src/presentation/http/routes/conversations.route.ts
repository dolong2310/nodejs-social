import { IChatMessagesController } from '@/presentation/http/controllers/chat-messages.controller';
import { IConversationsController } from '@/presentation/http/controllers/conversations.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { validateCursorPaginationQuery } from '@/presentation/http/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IChatMessagesValidation } from '@/presentation/http/validators/chat-messages.validator';
import { IConversationsValidation } from '@/presentation/http/validators/conversations.validator';
import { IUsersValidation } from '@/presentation/http/validators/users.validator';

export class ConversationsRoute extends BaseRoute {
  constructor(
    private readonly conversationsController: IConversationsController,
    private readonly conversationsValidation: IConversationsValidation,
    private readonly chatMessagesController: IChatMessagesController,
    private readonly chatMessagesValidation: IChatMessagesValidation,
    private readonly usersValidation: IUsersValidation
  ) {
    super('/conversations');
    this.initializeRoutes();
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
    } = this.conversationsController;
    const { listMessages, sendMessage, markRead } = this.chatMessagesController;
    const { userVerifiedValidation } = this.usersValidation;
    const {
      peerUserIdBody,
      createGroupBody,
      conversationIdParam,
      patchConversationBody,
      inviteUserIdBody,
      kickTargetUserIdParam,
      patchMemberRoleBody,
      newAdminUserIdBody
    } = this.conversationsValidation;
    const { sendMessageBody, markReadBody } = this.chatMessagesValidation;

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
