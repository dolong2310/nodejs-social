/*
 * This file defines the users routes for getting user profile, updating user profile, and getting user profile by username.
 */

import { BaseRoute, UsersController, UsersValidation, optionalProtect, protect } from '@/modules';
import { appLimiter } from '@/shared';
import { asyncHandler } from '@/utils';

class UsersRoute extends BaseRoute {
  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    const { getMe, updateMe, getUserProfile } = this.container.get(UsersController);
    const { userVerifiedValidation, updateMeValidation } = this.container.get(UsersValidation);

    this.router.get('/me', appLimiter, protect, asyncHandler(getMe));
    this.router.patch('/me', appLimiter, protect, userVerifiedValidation, updateMeValidation, asyncHandler(updateMe));
    this.router.get('/:username', appLimiter, optionalProtect, asyncHandler(getUserProfile));
  }
}

export function usersRouter() {
  return new UsersRoute().getRouter();
}
