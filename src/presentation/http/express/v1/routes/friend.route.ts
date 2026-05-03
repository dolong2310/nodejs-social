import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IFriendController } from '@/presentation/http/express/v1/controllers/friend.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { IFriendValidator } from '@/presentation/http/express/v1/validators/friend.validator';
import { validateCursorPaginationQuery } from '@/presentation/http/express/v1/validators/pagination.validator';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class FriendRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'friends';

  constructor(
    private readonly friendController: IFriendController,
    private readonly friendValidator: IFriendValidator,
    private readonly userValidator: IUserValidator,
    private readonly authGuard: AuthGuard,
    private readonly throttler: ThrottlerProxyGuard
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
    const { userActiveValidator } = this.userValidator;
    const {
      sendRequestToUserIdValidator,
      incomingFromUserIdValidator,
      revokeOutgoingToUserIdValidator,
      unfriendUserIdValidator
    } = this.friendValidator;
    const authGuard = this.authGuard.handler;
    const throttler = this.throttler.handler();

    this.router.get('/', authGuard, userActiveValidator, validateCursorPaginationQuery, asyncHandler(listFriends));
    this.router.get(
      '/requests/incoming',
      authGuard,
      userActiveValidator,
      validateCursorPaginationQuery,
      asyncHandler(listIncoming)
    );
    this.router.get(
      '/requests/outgoing',
      authGuard,
      userActiveValidator,
      validateCursorPaginationQuery,
      asyncHandler(listOutgoing)
    );
    this.router.post(
      '/requests',
      throttler,
      authGuard,
      userActiveValidator,
      sendRequestToUserIdValidator,
      asyncHandler(sendFriendRequest)
    );
    this.router.post(
      '/requests/:fromUserId/accept',
      throttler,
      authGuard,
      userActiveValidator,
      incomingFromUserIdValidator,
      asyncHandler(acceptIncomingRequest)
    );
    this.router.post(
      '/requests/:fromUserId/decline',
      throttler,
      authGuard,
      userActiveValidator,
      incomingFromUserIdValidator,
      asyncHandler(declineIncomingRequest)
    );
    this.router.delete(
      '/requests/outgoing/:toUserId',
      throttler,
      authGuard,
      userActiveValidator,
      revokeOutgoingToUserIdValidator,
      asyncHandler(revokeOutgoingRequest)
    );
    this.router.delete(
      '/:userId',
      throttler,
      authGuard,
      userActiveValidator,
      unfriendUserIdValidator,
      asyncHandler(unfriend)
    );
  }
}
