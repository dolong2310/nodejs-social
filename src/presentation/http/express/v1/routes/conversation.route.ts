import { CONVERSATION_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/conversation.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import type { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import type { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import type { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import type { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import type { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import type { IChatMessageController } from '@/presentation/http/express/v1/controllers/chat-message.controller';
import type { IConversationController } from '@/presentation/http/express/v1/controllers/conversation.controller';
import type { IChatMessagePipe } from '@/presentation/http/express/v1/pipes/chat-message.pipe';
import type { IConversationPipe } from '@/presentation/http/express/v1/pipes/conversation.pipe';
import type { IPaginationPipe } from '@/presentation/http/express/v1/pipes/pagination.pipe';

export class ConversationRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'conversations';

  constructor(
    private readonly conversationController: IConversationController,
    private readonly conversationPipe: IConversationPipe,
    private readonly chatMessageController: IChatMessageController,
    private readonly chatMessagePipe: IChatMessagePipe,
    private readonly paginationPipe: IPaginationPipe,
    private readonly authGuard: AuthGuard,
    private readonly activeUserGuard: ActiveUserGuard,
    private readonly throttlerGuard: ThrottlerProxyGuard,
    private readonly loggingInterceptor: LoggingInterceptor,
    private readonly transformResponseInterceptor: TransformResponseInterceptor,
    private readonly timeoutInterceptor: TimeoutInterceptor,
    private readonly idempotencyInterceptor: IdempotencyInterceptor
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const configs: RouterConfig[] = [
      {
        path: '/direct',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(CONVERSATION_THROTTLE_CONFIG.CREATE_DIRECT)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.conversationPipe.peerUserIdBody],
        controller: this.conversationController.createDirect
      },
      {
        path: '/groups',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(CONVERSATION_THROTTLE_CONFIG.CREATE_GROUP)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.conversationPipe.createGroupBody],
        controller: this.conversationController.createGroup
      },
      {
        path: '/',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(CONVERSATION_THROTTLE_CONFIG.LIST)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.paginationPipe.cursorPaginationQuery],
        controller: this.conversationController.listConversations
      },
      {
        path: '/:conversationId',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(CONVERSATION_THROTTLE_CONFIG.GET)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.conversationPipe.conversationIdParam],
        controller: this.conversationController.getConversation
      },
      {
        path: '/:conversationId',
        method: 'patch',
        middlewares: [this.throttlerGuard.handler(CONVERSATION_THROTTLE_CONFIG.UPDATE)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.conversationPipe.conversationIdParam, this.conversationPipe.patchConversationBody],
        controller: this.conversationController.patchConversation
      },
      {
        path: '/:conversationId/members',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(CONVERSATION_THROTTLE_CONFIG.INVITE_MEMBER)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.conversationPipe.conversationIdParam, this.conversationPipe.inviteUserIdBody],
        controller: this.conversationController.inviteMember
      },
      {
        path: '/:conversationId/members/me',
        method: 'delete',
        middlewares: [this.throttlerGuard.handler(CONVERSATION_THROTTLE_CONFIG.LEAVE)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.conversationPipe.conversationIdParam],
        controller: this.conversationController.leaveConversation
      },
      {
        path: '/:conversationId/members/:userId',
        method: 'delete',
        middlewares: [this.throttlerGuard.handler(CONVERSATION_THROTTLE_CONFIG.KICK_MEMBER)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.conversationPipe.conversationIdParam, this.conversationPipe.kickTargetUserIdParam],
        controller: this.conversationController.kickMember
      },
      {
        path: '/:conversationId/members/:userId/role',
        method: 'patch',
        middlewares: [this.throttlerGuard.handler(CONVERSATION_THROTTLE_CONFIG.UPDATE_MEMBER_ROLE)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [
          this.conversationPipe.conversationIdParam,
          this.conversationPipe.kickTargetUserIdParam,
          this.conversationPipe.patchMemberRoleBody
        ],
        controller: this.conversationController.patchMemberRole
      },
      {
        path: '/:conversationId/admin/transfer',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(CONVERSATION_THROTTLE_CONFIG.TRANSFER_ADMIN)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.conversationPipe.conversationIdParam, this.conversationPipe.newAdminUserIdBody],
        controller: this.conversationController.transferAdmin
      },
      // Chat Messages
      {
        path: '/:conversationId/messages',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(CONVERSATION_THROTTLE_CONFIG.LIST_MESSAGES)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.paginationPipe.cursorPaginationQuery, this.conversationPipe.conversationIdParam],
        controller: this.chatMessageController.listMessages
      },
      {
        path: '/:conversationId/messages',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(CONVERSATION_THROTTLE_CONFIG.SEND_MESSAGE)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.conversationPipe.conversationIdParam, this.chatMessagePipe.sendMessageBody],
        controller: this.chatMessageController.sendMessage
      },
      {
        path: '/:conversationId/read',
        method: 'patch',
        middlewares: [this.throttlerGuard.handler(CONVERSATION_THROTTLE_CONFIG.MARK_READ)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.conversationPipe.conversationIdParam, this.chatMessagePipe.markReadBody],
        controller: this.chatMessageController.markRead
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
