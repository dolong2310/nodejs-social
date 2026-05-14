import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IFriendController } from '@/presentation/http/express/v1/controllers/friend.controller';
import { IFriendPipe } from '@/presentation/http/express/v1/pipes/friend.pipe';
import { validateCursorPaginationQuery } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';

export class FriendRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'friends';

  constructor(
    private readonly friendController: IFriendController,
    private readonly friendPipe: IFriendPipe,
    private readonly userPipe: IUserPipe,
    private readonly authGuard: AuthGuard,
    private readonly throttlerGuard: ThrottlerProxyGuard,
    private readonly loggingInterceptor: LoggingInterceptor,
    private readonly transformResponseInterceptor: TransformResponseInterceptor,
    private readonly timeoutInterceptor: TimeoutInterceptor
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const throttler = this.throttlerGuard.handler();

    this.router.get(
      '/',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validateCursorPaginationQuery, this.userPipe.userActivePipe],
        controller: this.friendController.listFriends
      })
    );
    this.router.get(
      '/requests/incoming',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validateCursorPaginationQuery, this.userPipe.userActivePipe],
        controller: this.friendController.listIncoming
      })
    );
    this.router.get(
      '/requests/outgoing',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validateCursorPaginationQuery, this.userPipe.userActivePipe],
        controller: this.friendController.listOutgoing
      })
    );
    this.router.post(
      '/requests',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.friendPipe.sendRequestToUserIdPipe],
        controller: this.friendController.sendFriendRequest
      })
    );
    this.router.post(
      '/requests/:fromUserId/accept',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.friendPipe.incomingFromUserIdPipe],
        controller: this.friendController.acceptIncomingRequest
      })
    );
    this.router.post(
      '/requests/:fromUserId/decline',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.friendPipe.incomingFromUserIdPipe],
        controller: this.friendController.declineIncomingRequest
      })
    );
    this.router.delete(
      '/requests/outgoing/:toUserId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.friendPipe.revokeOutgoingToUserIdPipe],
        controller: this.friendController.revokeOutgoingRequest
      })
    );
    this.router.delete(
      '/:userId',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.friendPipe.unfriendUserIdPipe],
        controller: this.friendController.unfriend
      })
    );
  }
}
