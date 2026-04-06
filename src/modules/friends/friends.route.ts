import { protect } from '@/modules/auth/auth.middleware';
import { BaseRoute } from '@/modules/base/base.route';
import { FriendsController } from '@/modules/friends/friends.controller';
import { FriendsValidation } from '@/modules/friends/friends.validation';
import { UsersValidation } from '@/modules/users/users.validation';
import { validateCursorPaginationQuery } from '@/shared/middlewares/common.middleware';
import { appLimiter } from '@/shared/middlewares/limiter.middleware';
import { asyncHandler } from '@/utils/handler.util';

class FriendsRoute extends BaseRoute {
  constructor() {
    super();
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
    } = this.container.get(FriendsController);
    const { userVerifiedValidation } = this.container.get(UsersValidation);
    const {
      sendRequestToUserIdValidation,
      incomingFromUserIdValidation,
      revokeOutgoingToUserIdValidation,
      unfriendUserIdValidation
    } = this.container.get(FriendsValidation);

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

export function friendsRouter() {
  return new FriendsRoute().getRouter();
}
