import { IChatMessageController } from '@/presentation/http/controllers/chat-message.controller';
import { IConversationController } from '@/presentation/http/controllers/conversation.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { validateCursorPaginationQuery } from '@/presentation/http/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IChatMessageValidator } from '@/presentation/http/validators/chat-message.validator';
import { IConversationValidator } from '@/presentation/http/validators/conversation.validator';
import { IUserValidator } from '@/presentation/http/validators/user.validator';

export class ConversationRoute extends BaseRoute {
  protected override readonly pathName = '/conversations';

  constructor(
    private readonly conversationController: IConversationController,
    private readonly conversationValidator: IConversationValidator,
    private readonly chatMessageController: IChatMessageController,
    private readonly chatMessageValidator: IChatMessageValidator,
    private readonly userValidator: IUserValidator
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
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
    } = this.conversationController;
    const { listMessages, sendMessage, markRead } = this.chatMessageController;
    const { userVerifiedValidator } = this.userValidator;
    const {
      peerUserIdBody,
      createGroupBody,
      conversationIdParam,
      patchConversationBody,
      inviteUserIdBody,
      kickTargetUserIdParam,
      patchMemberRoleBody,
      newAdminUserIdBody
    } = this.conversationValidator;
    const { sendMessageBody, markReadBody } = this.chatMessageValidator;

    this.router.post('/direct', appLimiter, protect, userVerifiedValidator, peerUserIdBody, asyncHandler(createDirect));
    this.router.post('/groups', appLimiter, protect, userVerifiedValidator, createGroupBody, asyncHandler(createGroup));
    this.router.get(
      '/',
      appLimiter,
      protect,
      userVerifiedValidator,
      validateCursorPaginationQuery,
      asyncHandler(listConversations)
    );
    this.router.get(
      '/:conversationId',
      appLimiter,
      protect,
      userVerifiedValidator,
      conversationIdParam,
      asyncHandler(getConversation)
    );
    this.router.patch(
      '/:conversationId',
      appLimiter,
      protect,
      userVerifiedValidator,
      conversationIdParam,
      patchConversationBody,
      asyncHandler(patchConversation)
    );
    this.router.post(
      '/:conversationId/members',
      appLimiter,
      protect,
      userVerifiedValidator,
      conversationIdParam,
      inviteUserIdBody,
      asyncHandler(inviteMember)
    );
    this.router.delete(
      '/:conversationId/members/me',
      appLimiter,
      protect,
      userVerifiedValidator,
      conversationIdParam,
      asyncHandler(leaveConversation)
    );
    this.router.delete(
      '/:conversationId/members/:userId',
      appLimiter,
      protect,
      userVerifiedValidator,
      conversationIdParam,
      kickTargetUserIdParam,
      asyncHandler(kickMember)
    );
    this.router.patch(
      '/:conversationId/members/:userId/role',
      appLimiter,
      protect,
      userVerifiedValidator,
      conversationIdParam,
      kickTargetUserIdParam,
      patchMemberRoleBody,
      asyncHandler(patchMemberRole)
    );
    this.router.post(
      '/:conversationId/admin/transfer',
      appLimiter,
      protect,
      userVerifiedValidator,
      conversationIdParam,
      newAdminUserIdBody,
      asyncHandler(transferAdmin)
    );

    // Chat Messages
    this.router.get(
      '/:conversationId/messages',
      appLimiter,
      protect,
      userVerifiedValidator,
      conversationIdParam,
      validateCursorPaginationQuery,
      asyncHandler(listMessages)
    );
    this.router.post(
      '/:conversationId/messages',
      appLimiter,
      protect,
      userVerifiedValidator,
      conversationIdParam,
      sendMessageBody,
      asyncHandler(sendMessage)
    );
    this.router.patch(
      '/:conversationId/read',
      appLimiter,
      protect,
      userVerifiedValidator,
      conversationIdParam,
      markReadBody,
      asyncHandler(markRead)
    );
  }
}
