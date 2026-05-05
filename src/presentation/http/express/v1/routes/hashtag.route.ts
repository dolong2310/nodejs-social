import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { IHashtagController } from '@/presentation/http/express/v1/controllers/hashtag.controller';
import { IHashtagsPipe } from '@/presentation/http/express/v1/pipes/hashtag.pipe';
import { validatePaginationQuery } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class HashtagRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'hashtags';

  constructor(
    private readonly hashtagController: IHashtagController,
    private readonly hashtagsPipe: IHashtagsPipe,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const hashtagIdParam = this.hashtagsPipe.hashtagIdParam();
    const createBodyPipe = this.hashtagsPipe.createBodyPipe();
    const updateBodyPipe = this.hashtagsPipe.updateBodyPipe();
    const authGuard = this.authGuard.handler;
    const throttler = this.throttlerGuard();

    this.router.get('/', throttler, authGuard, validatePaginationQuery, this.interceptor(this.hashtagController.list));
    this.router.post('/', throttler, authGuard, createBodyPipe, this.interceptor(this.hashtagController.create));
    this.router.get(
      '/:hashtagId',
      throttler,
      authGuard,
      hashtagIdParam,
      this.interceptor(this.hashtagController.getById)
    );
    this.router.put(
      '/:hashtagId',
      throttler,
      authGuard,
      hashtagIdParam,
      updateBodyPipe,
      this.interceptor(this.hashtagController.update)
    );
    this.router.delete(
      '/:hashtagId',
      throttler,
      authGuard,
      hashtagIdParam,
      this.interceptor(this.hashtagController.remove)
    );
  }
}
