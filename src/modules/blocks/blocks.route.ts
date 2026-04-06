import { protect } from '@/modules/auth/auth.middleware';
import { BaseRoute } from '@/modules/base/base.route';
import { BlocksController } from '@/modules/blocks/blocks.controller';
import { BlocksValidation } from '@/modules/blocks/blocks.validation';
import { UsersValidation } from '@/modules/users/users.validation';
import { validatePaginationQuery } from '@/shared/middlewares/common.middleware';
import { appLimiter } from '@/shared/middlewares/limiter.middleware';
import { asyncHandler } from '@/utils/handler.util';

class BlocksRoute extends BaseRoute {
  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    const { listBlocked, blockUser, unblockUser } = this.container.get(BlocksController);
    const { userVerifiedValidation } = this.container.get(UsersValidation);
    const { blockUserBodyValidation, unblockUserIdValidation } = this.container.get(BlocksValidation);

    this.router.get('/', protect, userVerifiedValidation, validatePaginationQuery, asyncHandler(listBlocked));
    this.router.post(
      '/',
      appLimiter,
      protect,
      userVerifiedValidation,
      blockUserBodyValidation,
      asyncHandler(blockUser)
    );
    this.router.delete(
      '/:userId',
      appLimiter,
      protect,
      userVerifiedValidation,
      unblockUserIdValidation,
      asyncHandler(unblockUser)
    );
  }
}

export function blocksRouter() {
  return new BlocksRoute().getRouter();
}
