import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IBlockController } from '@/presentation/http/express/v1/controllers/block.controller';
import { IBlockPipe } from '@/presentation/http/express/v1/pipes/block.pipe';
import { validatePaginationQuery } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class BlockRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'blocks';

  constructor(
    private readonly blockController: IBlockController,
    private readonly blockPipe: IBlockPipe,
    private readonly userPipe: IUserPipe,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { listBlocked, blockUser, unblockUser } = this.blockController;
    const { blockUserBodyPipe, unblockUserIdPipe } = this.blockPipe;
    const { userActivePipe } = this.userPipe;
    const authGuard = this.authGuard.handler;
    const throttler = this.throttlerGuard();

    this.router.get(
      '/',
      authGuard,
      userActivePipe,
      validatePaginationQuery,
      asyncHandler(this.transformInterceptor(listBlocked))
    );
    this.router.post(
      '/',
      throttler,
      authGuard,
      userActivePipe,
      blockUserBodyPipe,
      asyncHandler(this.transformInterceptor(blockUser))
    );
    this.router.delete(
      '/:userId',
      throttler,
      authGuard,
      userActivePipe,
      unblockUserIdPipe,
      asyncHandler(this.transformInterceptor(unblockUser))
    );
  }
}
