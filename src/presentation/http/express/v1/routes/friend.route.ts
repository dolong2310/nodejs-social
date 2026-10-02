import { FRIEND_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/friend.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import type { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import type { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import type { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import type { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import type { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import type { IFriendController } from '@/presentation/http/express/v1/controllers/friend.controller';
import { validate } from '@/presentation/http/express/pipes/validation.pipe';
import {
  cursorPaginatedSchema,
  CursorPaginationQuerySchema
} from '@/presentation/http/express/v1/schemas/common/pagination.schema';
import {
  IncomingRequestParamsSchema,
  OutgoingRequestParamsSchema,
  SendFriendRequestBodySchema,
  UnfriendParamsSchema
} from '@/presentation/http/express/v1/schemas/friend/friend.request.schema';
import {
  FriendRequestResponseSchema,
  UserRecordResponseSchema
} from '@/presentation/http/express/v1/schemas/friend/friend.response.schema';

export class FriendRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'friends';

  constructor(
    private readonly friendController: IFriendController,
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
        path: '/',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(FRIEND_THROTTLE_CONFIG.LIST_FRIENDS)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ query: CursorPaginationQuerySchema })],
        response: cursorPaginatedSchema(UserRecordResponseSchema),
        controller: this.friendController.listFriends
      },
      {
        path: '/requests/incoming',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(FRIEND_THROTTLE_CONFIG.LIST_INCOMING)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ query: CursorPaginationQuerySchema })],
        response: cursorPaginatedSchema(UserRecordResponseSchema),
        controller: this.friendController.listIncoming
      },
      {
        path: '/requests/outgoing',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(FRIEND_THROTTLE_CONFIG.LIST_OUTGOING)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ query: CursorPaginationQuerySchema })],
        response: cursorPaginatedSchema(UserRecordResponseSchema),
        controller: this.friendController.listOutgoing
      },
      {
        path: '/requests',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(FRIEND_THROTTLE_CONFIG.SEND_REQUEST)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ body: SendFriendRequestBodySchema })],
        response: FriendRequestResponseSchema,
        controller: this.friendController.sendFriendRequest
      },
      {
        path: '/requests/:fromUserId/accept',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(FRIEND_THROTTLE_CONFIG.ACCEPT_REQUEST)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: IncomingRequestParamsSchema })],
        controller: this.friendController.acceptIncomingRequest
      },
      {
        path: '/requests/:fromUserId/decline',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(FRIEND_THROTTLE_CONFIG.DECLINE_REQUEST)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: IncomingRequestParamsSchema })],
        controller: this.friendController.declineIncomingRequest
      },
      {
        path: '/requests/outgoing/:toUserId',
        method: 'delete',
        middlewares: [this.throttlerGuard.handler(FRIEND_THROTTLE_CONFIG.REVOKE_REQUEST)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: OutgoingRequestParamsSchema })],
        controller: this.friendController.revokeOutgoingRequest
      },
      {
        path: '/:userId',
        method: 'delete',
        middlewares: [this.throttlerGuard.handler(FRIEND_THROTTLE_CONFIG.UNFRIEND)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [validate({ params: UnfriendParamsSchema })],
        controller: this.friendController.unfriend
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
