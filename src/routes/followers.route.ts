/*
 * This file defines the followers routes for following and unfollowing users.
 */

import { IFollowersController } from '@/controllers/followers.controller';
import { protect } from '@/middlewares/auth.middleware';
import { appLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';
import { IUsersValidation } from '@/validations/users.validation';

export class FollowersRoute extends BaseRoute {
  private followersController!: IFollowersController;
  private usersValidation!: IUsersValidation;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    // Initialize the controller here, after the container is available
    this.followersController = this.container.getFollowersController();
    this.usersValidation = this.container.getUsersValidation();

    this.router.post(
      '/',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.usersValidation.userIdValidation('followedUserId', 'body'),
      asyncHandler(this.followersController.followUser)
    );
    this.router.delete(
      '/:userId',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.usersValidation.userIdValidation('userId', 'params'),
      asyncHandler(this.followersController.unfollowUser)
    );
  }
}

export default () => {
  const followersRoute = new FollowersRoute();
  return followersRoute.getRouter();
};
