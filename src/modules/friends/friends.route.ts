/*
 * Friends graph: requests, accept/decline/revoke, list friends, unfriend.
 */

import { BaseRoute, IFriendsController, IFriendsValidation, IUsersValidation, protect } from '@/modules';
import { appLimiter, validatePaginationQuery } from '@/shared';
import { asyncHandler } from '@/utils';

class FriendsRoute extends BaseRoute {
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

export function friendsRouter() {
  return new FriendsRoute().getRouter();
}
