/*
 * Block / unblock / list blocked users (BLCK-01, BLCK-03).
 */

import { IBlocksController } from '@/controllers/blocks.controller';
import { protect } from '@/middlewares/auth.middleware';
import { validatePaginationQuery } from '@/middlewares/common.middleware';
import { appLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';
import { IBlocksValidation } from '@/validations/blocks.validation';
import { IUsersValidation } from '@/validations/users.validation';

export class BlocksRoute extends BaseRoute {
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

export default () => {
  const blocksRoute = new BlocksRoute();
  return blocksRoute.getRouter();
};
