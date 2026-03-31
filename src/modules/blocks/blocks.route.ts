/*
 * Block / unblock / list blocked users.
 */

import { BaseRoute, BlocksController, BlocksValidation, UsersValidation, protect } from '@/modules';
import { appLimiter, validatePaginationQuery } from '@/shared';
import { asyncHandler } from '@/utils';

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
