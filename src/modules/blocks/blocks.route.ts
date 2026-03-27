/*
 * Block / unblock / list blocked users.
 */

import { BaseRoute, IBlocksController, IBlocksValidation, IUsersValidation, protect } from '@/modules';
import { appLimiter, validatePaginationQuery } from '@/shared';
import { asyncHandler } from '@/utils';

class BlocksRoute extends BaseRoute {
  private blocksController!: IBlocksController;
  private usersValidation!: IUsersValidation;
  private blocksValidation!: IBlocksValidation;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    this.blocksController = this.container.getBlocksController();
    this.usersValidation = this.container.getUsersValidation();
    this.blocksValidation = this.container.getBlocksValidation();

    this.router.get(
      '/',
      protect,
      this.usersValidation.userVerifiedValidation,
      validatePaginationQuery,
      asyncHandler(this.blocksController.listBlocked)
    );
    this.router.post(
      '/',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.blocksValidation.blockUserBodyValidation,
      asyncHandler(this.blocksController.blockUser)
    );
    this.router.delete(
      '/:userId',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      this.blocksValidation.unblockUserIdValidation,
      asyncHandler(this.blocksController.unblockUser)
    );
  }
}

export function blocksRouter() {
  return new BlocksRoute().getRouter();
}
