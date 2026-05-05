import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IOAuthController } from '@/presentation/http/express/v1/controllers/oauth.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class OAuthRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'oauth';

  constructor(private readonly oauthController: IOAuthController) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { getGoogleAuthUrl, googleLogin } = this.oauthController;

    const throttler = this.throttlerGuard();

    this.router.get('/google/url', throttler, asyncHandler(this.transformInterceptor(getGoogleAuthUrl)));
    this.router.get('/google', throttler, asyncHandler(this.transformInterceptor(googleLogin)));
  }
}
