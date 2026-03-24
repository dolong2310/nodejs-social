/*
 * This file defines the users routes for getting user profile, updating user profile, and getting user profile by username.
 */

import { IUsersController } from '@/controllers/users.controller';
import { optionalProtect, protect } from '@/middlewares/auth.middleware';
import { appLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';
import { IUsersValidation } from '@/validations/users.validation';

export class UsersRoute extends BaseRoute {
  private usersController!: IUsersController;
  private usersValidation!: IUsersValidation;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    // Initialize the controller here, after the container is available
    this.usersController = this.container.getUsersController();
    this.usersValidation = this.container.getUsersValidation();

    this.router.get('/me', appLimiter, protect, asyncHandler(this.usersController.getMe));
    this.router.patch(
      '/me',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.usersValidation.updateMeValidation,
      asyncHandler(this.usersController.updateMe)
    );
    this.router.get('/:username', appLimiter, optionalProtect, asyncHandler(this.usersController.getUserProfile));
  }
}

export default () => {
  const usersRoute = new UsersRoute();
  return usersRoute.getRouter();
};
