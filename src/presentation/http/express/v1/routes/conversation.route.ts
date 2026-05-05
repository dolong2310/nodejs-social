import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { IChatMessageController } from '@/presentation/http/express/v1/controllers/chat-message.controller';
import { IConversationController } from '@/presentation/http/express/v1/controllers/conversation.controller';
import { IChatMessagePipe } from '@/presentation/http/express/v1/pipes/chat-message.pipe';
import { IConversationPipe } from '@/presentation/http/express/v1/pipes/conversation.pipe';
import { validateCursorPaginationQuery } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class ConversationRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'conversations';

  constructor(
    private readonly conversationController: IConversationController,
    private readonly conversationPipe: IConversationPipe,
    private readonly chatMessageController: IChatMessageController,
    private readonly chatMessagePipe: IChatMessagePipe,
    private readonly userPipe: IUserPipe,
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
    const { userActivePipe } = this.userPipe;
    const {
      peerUserIdBody,
      createGroupBody,
      conversationIdParam,
      patchConversationBody,
      inviteUserIdBody,
      kickTargetUserIdParam,
      patchMemberRoleBody,
      newAdminUserIdBody
    } = this.conversationPipe;
    const { sendMessageBody, markReadBody } = this.chatMessagePipe;
    const authGuard = this.authGuard.handler;
    const throttler = this.throttlerGuard();

    this.router.post('/direct', throttler, authGuard, userActivePipe, peerUserIdBody, this.interceptor(createDirect));
    this.router.post('/groups', throttler, authGuard, userActivePipe, createGroupBody, this.interceptor(createGroup));
    this.router.get(
      '/',
      throttler,
      authGuard,
      userActivePipe,
      validateCursorPaginationQuery,
      this.interceptor(listConversations)
    );
    this.router.get(
      '/:conversationId',
      throttler,
      authGuard,
      userActivePipe,
      conversationIdParam,
      this.interceptor(getConversation)
    );
    this.router.patch(
      '/:conversationId',
      throttler,
      authGuard,
      userActivePipe,
      conversationIdParam,
      patchConversationBody,
      this.interceptor(patchConversation)
    );
    this.router.post(
      '/:conversationId/members',
      throttler,
      authGuard,
      userActivePipe,
      conversationIdParam,
      inviteUserIdBody,
      this.interceptor(inviteMember)
    );
    this.router.delete(
      '/:conversationId/members/me',
      throttler,
      authGuard,
      userActivePipe,
      conversationIdParam,
      this.interceptor(leaveConversation)
    );
    this.router.delete(
      '/:conversationId/members/:userId',
      throttler,
      authGuard,
      userActivePipe,
      conversationIdParam,
      kickTargetUserIdParam,
      this.interceptor(kickMember)
    );
    this.router.patch(
      '/:conversationId/members/:userId/role',
      throttler,
      authGuard,
      userActivePipe,
      conversationIdParam,
      kickTargetUserIdParam,
      patchMemberRoleBody,
      this.interceptor(patchMemberRole)
    );
    this.router.post(
      '/:conversationId/admin/transfer',
      throttler,
      authGuard,
      userActivePipe,
      conversationIdParam,
      newAdminUserIdBody,
      this.interceptor(transferAdmin)
    );

    // Chat Messages
    this.router.get(
      '/:conversationId/messages',
      throttler,
      authGuard,
      userActivePipe,
      conversationIdParam,
      validateCursorPaginationQuery,
      this.interceptor(listMessages)
    );
    this.router.post(
      '/:conversationId/messages',
      throttler,
      authGuard,
      userActivePipe,
      conversationIdParam,
      sendMessageBody,
      this.interceptor(sendMessage)
    );
    this.router.patch(
      '/:conversationId/read',
      throttler,
      authGuard,
      userActivePipe,
      conversationIdParam,
      markReadBody,
      this.interceptor(markRead)
    );
  }
}
