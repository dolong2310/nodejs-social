import { IFriendsController } from '@/presentation/http/controllers/friends.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { validateCursorPaginationQuery } from '@/presentation/http/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IFriendsValidation } from '@/presentation/http/validators/friends.validator';
import { IUsersValidation } from '@/presentation/http/validators/users.validator';

export class FriendsRoute extends BaseRoute {
  constructor(
    private readonly friendsController: IFriendsController,
    private readonly friendsValidation: IFriendsValidation,
    private readonly usersValidation: IUsersValidation
  ) {
    super('/friends');
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    const {
      listFriends,
      listIncoming,
      listOutgoing,
      sendFriendRequest,
      acceptIncomingRequest,
      declineIncomingRequest,
      revokeOutgoingRequest,
      unfriend
    } = this.friendsController;
    const { userVerifiedValidation } = this.usersValidation;
    const {
      sendRequestToUserIdValidation,
      incomingFromUserIdValidation,
      revokeOutgoingToUserIdValidation,
      unfriendUserIdValidation
    } = this.friendsValidation;

    this.router.get('/', protect, userVerifiedValidation, validateCursorPaginationQuery, asyncHandler(listFriends));
    this.router.get(
      '/requests/incoming',
      protect,
      userVerifiedValidation,
      validateCursorPaginationQuery,
      asyncHandler(listIncoming)
    );
    this.router.get(
      '/requests/outgoing',
      protect,
      userVerifiedValidation,
      validateCursorPaginationQuery,
      asyncHandler(listOutgoing)
    );
    this.router.post(
      '/requests',
      appLimiter,
      protect,
      userVerifiedValidation,
      sendRequestToUserIdValidation,
      asyncHandler(sendFriendRequest)
    );
    this.router.post(
      '/requests/:fromUserId/accept',
      appLimiter,
      protect,
      userVerifiedValidation,
      incomingFromUserIdValidation,
      asyncHandler(acceptIncomingRequest)
    );
    this.router.post(
      '/requests/:fromUserId/decline',
      appLimiter,
      protect,
      userVerifiedValidation,
      incomingFromUserIdValidation,
      asyncHandler(declineIncomingRequest)
    );
    this.router.delete(
      '/requests/outgoing/:toUserId',
      appLimiter,
      protect,
      userVerifiedValidation,
      revokeOutgoingToUserIdValidation,
      asyncHandler(revokeOutgoingRequest)
    );
    this.router.delete(
      '/:userId',
      appLimiter,
      protect,
      userVerifiedValidation,
      unfriendUserIdValidation,
      asyncHandler(unfriend)
    );
  }
}
