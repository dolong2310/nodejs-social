/*
 * This file defines the users routes for getting user profile, updating user profile, and getting user profile by username.
 */

import { BaseRoute, IUsersController, IUsersValidation, optionalProtect, protect } from '@/modules';
import { appLimiter } from '@/shared';
import { asyncHandler } from '@/utils';

class UsersRoute extends BaseRoute {
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

export function usersRouter() {
  return new UsersRoute().getRouter();
}
