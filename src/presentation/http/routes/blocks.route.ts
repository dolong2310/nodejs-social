import { IBlocksController } from '@/presentation/http/controllers/blocks.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { validatePaginationQuery } from '@/presentation/http/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IBlocksValidation } from '@/presentation/http/validators/blocks.validator';
import { IUsersValidation } from '@/presentation/http/validators/users.validator';

export class BlocksRoute extends BaseRoute {
  constructor(
    private readonly blocksController: IBlocksController,
    private readonly blocksValidation: IBlocksValidation,
    private readonly usersValidation: IUsersValidation
  ) {
    super('/blocks');
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    const { listBlocked, blockUser, unblockUser } = this.blocksController;
    const { blockUserBodyValidation, unblockUserIdValidation } = this.blocksValidation;
    const { userVerifiedValidation } = this.usersValidation;

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
