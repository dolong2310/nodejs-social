import { optionalProtect, protect } from '@/modules/auth/auth.middleware';
import { BaseRoute } from '@/modules/base/base.route';
import { UsersController } from '@/modules/users/users.controller';
import { UsersValidation } from '@/modules/users/users.validation';
import { appLimiter } from '@/shared/middlewares/limiter.middleware';
import { asyncHandler } from '@/utils/handler.util';

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
