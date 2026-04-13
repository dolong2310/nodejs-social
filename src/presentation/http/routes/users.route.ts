import { IUsersController } from '@/presentation/http/controllers/users.controller';
import { optionalProtect, protect } from '@/presentation/http/middlewares/auth.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IUsersValidation } from '@/presentation/http/validators/users.validator';

export class UsersRoute extends BaseRoute {
  constructor(
    private readonly usersController: IUsersController,
    private readonly usersValidation: IUsersValidation
  ) {
    super('/users');
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    const { getMe, updateMe, getUserProfile } = this.usersController;
    const { userVerifiedValidation, updateMeValidation } = this.usersValidation;

    this.router.get('/me', appLimiter, protect, asyncHandler(getMe));
    this.router.patch('/me', appLimiter, protect, userVerifiedValidation, updateMeValidation, asyncHandler(updateMe));
    this.router.get('/:username', appLimiter, optionalProtect, asyncHandler(getUserProfile));
  }
}
