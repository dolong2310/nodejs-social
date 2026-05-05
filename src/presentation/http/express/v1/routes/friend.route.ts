import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
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

    this.router.get('/', authGuard, userActivePipe, validateCursorPaginationQuery, this.interceptor(listFriends));
    this.router.get(
      '/requests/incoming',
      authGuard,
      userActivePipe,
      validateCursorPaginationQuery,
      this.interceptor(listIncoming)
    );
    this.router.get(
      '/requests/outgoing',
      authGuard,
      userActivePipe,
      validateCursorPaginationQuery,
      this.interceptor(listOutgoing)
    );
    this.router.post(
      '/requests',
      throttler,
      authGuard,
      userActivePipe,
      sendRequestToUserIdPipe,
      this.interceptor(sendFriendRequest)
    );
    this.router.post(
      '/requests/:fromUserId/accept',
      throttler,
      authGuard,
      userActivePipe,
      incomingFromUserIdPipe,
      this.interceptor(acceptIncomingRequest)
    );
    this.router.post(
      '/requests/:fromUserId/decline',
      throttler,
      authGuard,
      userActivePipe,
      incomingFromUserIdPipe,
      this.interceptor(declineIncomingRequest)
    );
    this.router.delete(
      '/requests/outgoing/:toUserId',
      throttler,
      authGuard,
      userActivePipe,
      revokeOutgoingToUserIdPipe,
      this.interceptor(revokeOutgoingRequest)
    );
    this.router.delete(
      '/:userId',
      throttler,
      authGuard,
      userActivePipe,
      unfriendUserIdPipe,
      this.interceptor(unfriend)
    );
  }
}
