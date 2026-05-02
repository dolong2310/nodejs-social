import { AuthGuard } from '@/presentation/http/express/middlewares/auth.guard';
import { validateCursorPaginationQuery } from '@/presentation/http/express/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/express/middlewares/limiter.middleware';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IFriendController } from '@/presentation/http/express/v1/controllers/friend.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { IFriendValidator } from '@/presentation/http/express/v1/validators/friend.validator';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class FriendRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'friends';

  constructor(
    private readonly friendController: IFriendController,
    private readonly friendValidator: IFriendValidator,
    private readonly userValidator: IUserValidator,
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
    const { userActiveValidator } = this.userValidator;
    const {
      sendRequestToUserIdValidator,
      incomingFromUserIdValidator,
      revokeOutgoingToUserIdValidator,
      unfriendUserIdValidator
    } = this.friendValidator;
    const { protect } = this.authGuard;

    this.router.get('/', protect, userActiveValidator, validateCursorPaginationQuery, asyncHandler(listFriends));
    this.router.get(
      '/requests/incoming',
      protect,
      userActiveValidator,
      validateCursorPaginationQuery,
      asyncHandler(listIncoming)
    );
    this.router.get(
      '/requests/outgoing',
      protect,
      userActiveValidator,
      validateCursorPaginationQuery,
      asyncHandler(listOutgoing)
    );
    this.router.post(
      '/requests',
      appLimiter,
      protect,
      userActiveValidator,
      sendRequestToUserIdValidator,
      asyncHandler(sendFriendRequest)
    );
    this.router.post(
      '/requests/:fromUserId/accept',
      appLimiter,
      protect,
      userActiveValidator,
      incomingFromUserIdValidator,
      asyncHandler(acceptIncomingRequest)
    );
    this.router.post(
      '/requests/:fromUserId/decline',
      appLimiter,
      protect,
      userActiveValidator,
      incomingFromUserIdValidator,
      asyncHandler(declineIncomingRequest)
    );
    this.router.delete(
      '/requests/outgoing/:toUserId',
      appLimiter,
      protect,
      userActiveValidator,
      revokeOutgoingToUserIdValidator,
      asyncHandler(revokeOutgoingRequest)
    );
    this.router.delete(
      '/:userId',
      appLimiter,
      protect,
      userActiveValidator,
      unfriendUserIdValidator,
      asyncHandler(unfriend)
    );
  }
}
