/*
 * Friends graph: requests, accept/decline/revoke, list friends, unfriend.
 */

import { IFriendsController } from '@/controllers/friends.controller';
import { protect } from '@/middlewares/auth.middleware';
import { validatePaginationQuery } from '@/middlewares/common.middleware';
import { appLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';
import { IFriendsValidation } from '@/validations/friends.validation';
import { IUsersValidation } from '@/validations/users.validation';

export class FriendsRoute extends BaseRoute {
  private friendsController!: IFriendsController;
  private usersValidation!: IUsersValidation;
  private friendsValidation!: IFriendsValidation;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    this.friendsController = this.container.getFriendsController();
    this.usersValidation = this.container.getUsersValidation();
    this.friendsValidation = this.container.getFriendsValidation();

    this.router.get(
      '/',
      protect,
      this.usersValidation.userVerifiedValidation,
      validatePaginationQuery,
      asyncHandler(this.friendsController.listFriends)
    );
    this.router.get(
      '/requests/incoming',
      protect,
      this.usersValidation.userVerifiedValidation,
      validatePaginationQuery,
      asyncHandler(this.friendsController.listIncoming)
    );
    this.router.get(
      '/requests/outgoing',
      protect,
      this.usersValidation.userVerifiedValidation,
      validatePaginationQuery,
      asyncHandler(this.friendsController.listOutgoing)
    );
    this.router.post(
      '/requests',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.friendsValidation.sendRequestToUserIdValidation,
      asyncHandler(this.friendsController.sendFriendRequest)
    );
    this.router.post(
      '/requests/:fromUserId/accept',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.friendsValidation.incomingFromUserIdValidation,
      asyncHandler(this.friendsController.acceptIncomingRequest)
    );
    this.router.post(
      '/requests/:fromUserId/decline',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.friendsValidation.incomingFromUserIdValidation,
      asyncHandler(this.friendsController.declineIncomingRequest)
    );
    this.router.delete(
      '/requests/outgoing/:toUserId',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.friendsValidation.revokeOutgoingToUserIdValidation,
      asyncHandler(this.friendsController.revokeOutgoingRequest)
    );
    this.router.delete(
      '/:userId',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.friendsValidation.unfriendUserIdValidation,
      asyncHandler(this.friendsController.unfriend)
    );
  }
}

export default () => {
  const friendsRoute = new FriendsRoute();
  return friendsRoute.getRouter();
};
