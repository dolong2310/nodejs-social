import { AuthGuard } from '@/presentation/http/express/middlewares/auth.guard';
import { validatePaginationQuery } from '@/presentation/http/express/middlewares/common.middleware';
import { appLimiter } from '@/presentation/http/express/middlewares/limiter.middleware';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IBlockController } from '@/presentation/http/express/v1/controllers/block.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { IBlockValidator } from '@/presentation/http/express/v1/validators/block.validator';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class BlockRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'blocks';

  constructor(
    private readonly blockController: IBlockController,
    private readonly blockValidator: IBlockValidator,
    private readonly userValidator: IUserValidator,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { listBlocked, blockUser, unblockUser } = this.blockController;
    const { blockUserBodyValidator, unblockUserIdValidator } = this.blockValidator;
    const { userActiveValidator } = this.userValidator;
    const { protect } = this.authGuard;

    this.router.get('/', protect, userActiveValidator, validatePaginationQuery, asyncHandler(listBlocked));
    this.router.post('/', appLimiter, protect, userActiveValidator, blockUserBodyValidator, asyncHandler(blockUser));
    this.router.delete(
      '/:userId',
      appLimiter,
      protect,
      userActiveValidator,
      unblockUserIdValidator,
      asyncHandler(unblockUser)
    );
  }
}
