import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IFriendController } from '@/presentation/http/express/v1/controllers/friend.controller';
import { IFriendPipe } from '@/presentation/http/express/v1/pipes/friend.pipe';
import { validateCursorPaginationQuery } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class FriendRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'friends';

  constructor(
    private readonly friendController: IFriendController,
    private readonly friendPipe: IFriendPipe,
    private readonly userPipe: IUserPipe,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const {
      listFriends,
      listIncoming,
      listOutgoing,
      sendFriendRequest,
      acceptIncomingRequest,
      declineIncomingRequest,
      revokeOutgoingRequest,
      unfriend
    } = this.friendController;
    const { userActivePipe } = this.userPipe;
    const { sendRequestToUserIdPipe, incomingFromUserIdPipe, revokeOutgoingToUserIdPipe, unfriendUserIdPipe } =
      this.friendPipe;
    const authGuard = this.authGuard.handler;
    const throttler = this.throttlerGuard();

    this.router.get(
      '/',
      authGuard,
      userActivePipe,
      validateCursorPaginationQuery,
      asyncHandler(this.transformInterceptor(listFriends))
    );
    this.router.get(
      '/requests/incoming',
      authGuard,
      userActivePipe,
      validateCursorPaginationQuery,
      asyncHandler(this.transformInterceptor(listIncoming))
    );
    this.router.get(
      '/requests/outgoing',
      authGuard,
      userActivePipe,
      validateCursorPaginationQuery,
      asyncHandler(this.transformInterceptor(listOutgoing))
    );
    this.router.post(
      '/requests',
      throttler,
      authGuard,
      userActivePipe,
      sendRequestToUserIdPipe,
      asyncHandler(this.transformInterceptor(sendFriendRequest))
    );
    this.router.post(
      '/requests/:fromUserId/accept',
      throttler,
      authGuard,
      userActivePipe,
      incomingFromUserIdPipe,
      asyncHandler(this.transformInterceptor(acceptIncomingRequest))
    );
    this.router.post(
      '/requests/:fromUserId/decline',
      throttler,
      authGuard,
      userActivePipe,
      incomingFromUserIdPipe,
      asyncHandler(this.transformInterceptor(declineIncomingRequest))
    );
    this.router.delete(
      '/requests/outgoing/:toUserId',
      throttler,
      authGuard,
      userActivePipe,
      revokeOutgoingToUserIdPipe,
      asyncHandler(this.transformInterceptor(revokeOutgoingRequest))
    );
    this.router.delete(
      '/:userId',
      throttler,
      authGuard,
      userActivePipe,
      unfriendUserIdPipe,
      asyncHandler(this.transformInterceptor(unfriend))
    );
  }
}
