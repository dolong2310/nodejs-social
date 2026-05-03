import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IChatMessageController } from '@/presentation/http/express/v1/controllers/chat-message.controller';
import { IConversationController } from '@/presentation/http/express/v1/controllers/conversation.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { IChatMessageValidator } from '@/presentation/http/express/v1/validators/chat-message.validator';
import { IConversationValidator } from '@/presentation/http/express/v1/validators/conversation.validator';
import { validateCursorPaginationQuery } from '@/presentation/http/express/v1/validators/pagination.validator';
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
    private readonly authGuard: AuthGuard,
    private readonly throttler: ThrottlerProxyGuard
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
    const authGuard = this.authGuard.handler;
    const throttler = this.throttler.handler();

    this.router.post('/direct', throttler, authGuard, userActiveValidator, peerUserIdBody, asyncHandler(createDirect));
    this.router.post('/groups', throttler, authGuard, userActiveValidator, createGroupBody, asyncHandler(createGroup));
    this.router.get(
      '/',
      throttler,
      authGuard,
      userActiveValidator,
      validateCursorPaginationQuery,
      asyncHandler(listConversations)
    );
    this.router.get(
      '/:conversationId',
      throttler,
      authGuard,
      userActiveValidator,
      conversationIdParam,
      asyncHandler(getConversation)
    );
    this.router.patch(
      '/:conversationId',
      throttler,
      authGuard,
      userActiveValidator,
      conversationIdParam,
      patchConversationBody,
      asyncHandler(patchConversation)
    );
    this.router.post(
      '/:conversationId/members',
      throttler,
      authGuard,
      userActiveValidator,
      conversationIdParam,
      inviteUserIdBody,
      asyncHandler(inviteMember)
    );
    this.router.delete(
      '/:conversationId/members/me',
      throttler,
      authGuard,
      userActiveValidator,
      conversationIdParam,
      asyncHandler(leaveConversation)
    );
    this.router.delete(
      '/:conversationId/members/:userId',
      throttler,
      authGuard,
      userActiveValidator,
      conversationIdParam,
      kickTargetUserIdParam,
      asyncHandler(kickMember)
    );
    this.router.patch(
      '/:conversationId/members/:userId/role',
      throttler,
      authGuard,
      userActiveValidator,
      conversationIdParam,
      kickTargetUserIdParam,
      patchMemberRoleBody,
      asyncHandler(patchMemberRole)
    );
    this.router.post(
      '/:conversationId/admin/transfer',
      throttler,
      authGuard,
      userActiveValidator,
      conversationIdParam,
      newAdminUserIdBody,
      asyncHandler(transferAdmin)
    );

    // Chat Messages
    this.router.get(
      '/:conversationId/messages',
      throttler,
      authGuard,
      userActiveValidator,
      conversationIdParam,
      validateCursorPaginationQuery,
      asyncHandler(listMessages)
    );
    this.router.post(
      '/:conversationId/messages',
      throttler,
      authGuard,
      userActiveValidator,
      conversationIdParam,
      sendMessageBody,
      asyncHandler(sendMessage)
    );
    this.router.patch(
      '/:conversationId/read',
      throttler,
      authGuard,
      userActiveValidator,
      conversationIdParam,
      markReadBody,
      asyncHandler(markRead)
    );
  }
}
