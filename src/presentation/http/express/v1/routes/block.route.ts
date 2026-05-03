import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IBlockController } from '@/presentation/http/express/v1/controllers/block.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { IBlockValidator } from '@/presentation/http/express/v1/validators/block.validator';
import { validatePaginationQuery } from '@/presentation/http/express/v1/validators/pagination.validator';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class BlockRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'blocks';

  constructor(
    private readonly blockController: IBlockController,
    private readonly blockValidator: IBlockValidator,
    private readonly userValidator: IUserValidator,
    private readonly authGuard: AuthGuard,
    private readonly throttler: ThrottlerProxyGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { listBlocked, blockUser, unblockUser } = this.blockController;
    const { blockUserBodyValidator, unblockUserIdValidator } = this.blockValidator;
    const { userActiveValidator } = this.userValidator;
    const authGuard = this.authGuard.handler;
    const throttler = this.throttler.handler();

    this.router.get('/', authGuard, userActiveValidator, validatePaginationQuery, asyncHandler(listBlocked));
    this.router.post('/', throttler, authGuard, userActiveValidator, blockUserBodyValidator, asyncHandler(blockUser));
    this.router.delete(
      '/:userId',
      throttler,
      authGuard,
      userActiveValidator,
      unblockUserIdValidator,
      asyncHandler(unblockUser)
    );
  }
}
