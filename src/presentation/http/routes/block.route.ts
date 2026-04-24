import { IBlockController } from '@/presentation/http/controllers/block.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { validatePaginationQuery } from '@/presentation/http/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IBlockValidator } from '@/presentation/http/validators/block.validator';
import { IUserValidator } from '@/presentation/http/validators/user.validator';

export class BlockRoute extends BaseRoute {
  protected override readonly pathName = '/blocks';

  constructor(
    private readonly blockController: IBlockController,
    private readonly blockValidator: IBlockValidator,
    private readonly userValidator: IUserValidator
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { listBlocked, blockUser, unblockUser } = this.blockController;
    const { blockUserBodyValidator, unblockUserIdValidator } = this.blockValidator;
    const { userVerifiedValidator } = this.userValidator;

    this.router.get('/', protect, userVerifiedValidator, validatePaginationQuery, asyncHandler(listBlocked));
    this.router.post('/', appLimiter, protect, userVerifiedValidator, blockUserBodyValidator, asyncHandler(blockUser));
    this.router.delete(
      '/:userId',
      appLimiter,
      protect,
      userVerifiedValidator,
      unblockUserIdValidator,
      asyncHandler(unblockUser)
    );
  }
}
