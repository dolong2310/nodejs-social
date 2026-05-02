import { AuthGuard } from '@/presentation/http/express/middlewares/auth.guard';
import { validateCursorPaginationQuery } from '@/presentation/http/express/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/express/middlewares/limiter.middleware';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IChatMessageController } from '@/presentation/http/express/v1/controllers/chat-message.controller';
import { IConversationController } from '@/presentation/http/express/v1/controllers/conversation.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { IChatMessageValidator } from '@/presentation/http/express/v1/validators/chat-message.validator';
import { IConversationValidator } from '@/presentation/http/express/v1/validators/conversation.validator';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class ConversationRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'conversations';

  constructor(
    private readonly conversationController: IConversationController,
    private readonly conversationValidator: IConversationValidator,
    private readonly chatMessageController: IChatMessageController,
    private readonly chatMessageValidator: IChatMessageValidator,
    private readonly userValidator: IUserValidator,
    private readonly authGuard: AuthGuard
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
    const { userActiveValidator } = this.userValidator;
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
    const { protect } = this.authGuard;

    this.router.post('/direct', appLimiter, protect, userActiveValidator, peerUserIdBody, asyncHandler(createDirect));
    this.router.post('/groups', appLimiter, protect, userActiveValidator, createGroupBody, asyncHandler(createGroup));
    this.router.get(
      '/',
      appLimiter,
      protect,
      userActiveValidator,
      validateCursorPaginationQuery,
      asyncHandler(listConversations)
    );
    this.router.get(
      '/:conversationId',
      appLimiter,
      protect,
      userActiveValidator,
      conversationIdParam,
      asyncHandler(getConversation)
    );
    this.router.patch(
      '/:conversationId',
      appLimiter,
      protect,
      userActiveValidator,
      conversationIdParam,
      patchConversationBody,
      asyncHandler(patchConversation)
    );
    this.router.post(
      '/:conversationId/members',
      appLimiter,
      protect,
      userActiveValidator,
      conversationIdParam,
      inviteUserIdBody,
      asyncHandler(inviteMember)
    );
    this.router.delete(
      '/:conversationId/members/me',
      appLimiter,
      protect,
      userActiveValidator,
      conversationIdParam,
      asyncHandler(leaveConversation)
    );
    this.router.delete(
      '/:conversationId/members/:userId',
      appLimiter,
      protect,
      userActiveValidator,
      conversationIdParam,
      kickTargetUserIdParam,
      asyncHandler(kickMember)
    );
    this.router.patch(
      '/:conversationId/members/:userId/role',
      appLimiter,
      protect,
      userActiveValidator,
      conversationIdParam,
      kickTargetUserIdParam,
      patchMemberRoleBody,
      asyncHandler(patchMemberRole)
    );
    this.router.post(
      '/:conversationId/admin/transfer',
      appLimiter,
      protect,
      userActiveValidator,
      conversationIdParam,
      newAdminUserIdBody,
      asyncHandler(transferAdmin)
    );

    // Chat Messages
    this.router.get(
      '/:conversationId/messages',
      appLimiter,
      protect,
      userActiveValidator,
      conversationIdParam,
      validateCursorPaginationQuery,
      asyncHandler(listMessages)
    );
    this.router.post(
      '/:conversationId/messages',
      appLimiter,
      protect,
      userActiveValidator,
      conversationIdParam,
      sendMessageBody,
      asyncHandler(sendMessage)
    );
    this.router.patch(
      '/:conversationId/read',
      appLimiter,
      protect,
      userActiveValidator,
      conversationIdParam,
      markReadBody,
      asyncHandler(markRead)
    );
  }
}
