import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IChatMessageController } from '@/presentation/http/express/v1/controllers/chat-message.controller';
import { IConversationController } from '@/presentation/http/express/v1/controllers/conversation.controller';
import { IChatMessagePipe } from '@/presentation/http/express/v1/pipes/chat-message.pipe';
import { IConversationPipe } from '@/presentation/http/express/v1/pipes/conversation.pipe';
import { IPaginationPipe } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';

export class ConversationRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'conversations';

  constructor(
    private readonly conversationController: IConversationController,
    private readonly conversationPipe: IConversationPipe,
    private readonly chatMessageController: IChatMessageController,
    private readonly chatMessagePipe: IChatMessagePipe,
    private readonly paginationPipe: IPaginationPipe,
    private readonly userPipe: IUserPipe,
    private readonly authGuard: AuthGuard,
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
    const throttler = this.throttlerGuard.handler();

    this.router.post(
      '/direct',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.userPipe.userActivePipe, this.conversationPipe.peerUserIdBody],
        controller: this.conversationController.createDirect
      })
    );
    this.router.post(
      '/groups',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.userPipe.userActivePipe, this.conversationPipe.createGroupBody],
        controller: this.conversationController.createGroup
      })
    );
    this.router.get(
      '/',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.paginationPipe.cursorPaginationQuery, this.userPipe.userActivePipe],
        controller: this.conversationController.listConversations
      })
    );
    this.router.get(
      '/:conversationId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.conversationPipe.conversationIdParam],
        controller: this.conversationController.getConversation
      })
    );
    this.router.patch(
      '/:conversationId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [
          this.userPipe.userActivePipe,
          this.conversationPipe.conversationIdParam,
          this.conversationPipe.patchConversationBody
        ],
        controller: this.conversationController.patchConversation
      })
    );
    this.router.post(
      '/:conversationId/members',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [
          this.userPipe.userActivePipe,
          this.conversationPipe.conversationIdParam,
          this.conversationPipe.inviteUserIdBody
        ],
        controller: this.conversationController.inviteMember
      })
    );
    this.router.delete(
      '/:conversationId/members/me',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.userPipe.userActivePipe, this.conversationPipe.conversationIdParam],
        controller: this.conversationController.leaveConversation
      })
    );
    this.router.delete(
      '/:conversationId/members/:userId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [
          this.userPipe.userActivePipe,
          this.conversationPipe.conversationIdParam,
          this.conversationPipe.kickTargetUserIdParam
        ],
        controller: this.conversationController.kickMember
      })
    );
    this.router.patch(
      '/:conversationId/members/:userId/role',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [
          this.userPipe.userActivePipe,
          this.conversationPipe.conversationIdParam,
          this.conversationPipe.kickTargetUserIdParam,
          this.conversationPipe.patchMemberRoleBody
        ],
        controller: this.conversationController.patchMemberRole
      })
    );
    this.router.post(
      '/:conversationId/admin/transfer',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [
          this.userPipe.userActivePipe,
          this.conversationPipe.conversationIdParam,
          this.conversationPipe.newAdminUserIdBody
        ],
        controller: this.conversationController.transferAdmin
      })
    );

    // Chat Messages
    this.router.get(
      '/:conversationId/messages',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [
          this.paginationPipe.cursorPaginationQuery,
          this.userPipe.userActivePipe,
          this.conversationPipe.conversationIdParam
        ],
        controller: this.chatMessageController.listMessages
      })
    );
    this.router.post(
      '/:conversationId/messages',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [
          this.userPipe.userActivePipe,
          this.conversationPipe.conversationIdParam,
          this.chatMessagePipe.sendMessageBody
        ],
        controller: this.chatMessageController.sendMessage
      })
    );
    this.router.patch(
      '/:conversationId/read',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [
          this.userPipe.userActivePipe,
          this.conversationPipe.conversationIdParam,
          this.chatMessagePipe.markReadBody
        ],
        controller: this.chatMessageController.markRead
      })
    );
  }
}
