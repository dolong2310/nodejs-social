import { IFriendController } from '@/presentation/http/controllers/friend.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { validateCursorPaginationQuery } from '@/presentation/http/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IFriendValidator } from '@/presentation/http/validators/friend.validator';
import { IUserValidator } from '@/presentation/http/validators/user.validator';

export class FriendRoute extends BaseRoute {
  protected override readonly pathName = '/friends';

  constructor(
    private readonly friendController: IFriendController,
    private readonly friendValidator: IFriendValidator,
    private readonly userValidator: IUserValidator
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
    const { userVerifiedValidator } = this.userValidator;
    const {
      sendRequestToUserIdValidator,
      incomingFromUserIdValidator,
      revokeOutgoingToUserIdValidator,
      unfriendUserIdValidator
    } = this.friendValidator;

    this.router.get('/', protect, userVerifiedValidator, validateCursorPaginationQuery, asyncHandler(listFriends));
    this.router.get(
      '/requests/incoming',
      protect,
      userVerifiedValidator,
      validateCursorPaginationQuery,
      asyncHandler(listIncoming)
    );
    this.router.get(
      '/requests/outgoing',
      protect,
      userVerifiedValidator,
      validateCursorPaginationQuery,
      asyncHandler(listOutgoing)
    );
    this.router.post(
      '/requests',
      appLimiter,
      protect,
      userVerifiedValidator,
      sendRequestToUserIdValidator,
      asyncHandler(sendFriendRequest)
    );
    this.router.post(
      '/requests/:fromUserId/accept',
      appLimiter,
      protect,
      userVerifiedValidator,
      incomingFromUserIdValidator,
      asyncHandler(acceptIncomingRequest)
    );
    this.router.post(
      '/requests/:fromUserId/decline',
      appLimiter,
      protect,
      userVerifiedValidator,
      incomingFromUserIdValidator,
      asyncHandler(declineIncomingRequest)
    );
    this.router.delete(
      '/requests/outgoing/:toUserId',
      appLimiter,
      protect,
      userVerifiedValidator,
      revokeOutgoingToUserIdValidator,
      asyncHandler(revokeOutgoingRequest)
    );
    this.router.delete(
      '/:userId',
      appLimiter,
      protect,
      userVerifiedValidator,
      unfriendUserIdValidator,
      asyncHandler(unfriend)
    );
  }
}
