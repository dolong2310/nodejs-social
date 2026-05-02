import { IOAuthController } from '@/presentation/http/express/v1/controllers/oauth.controller';
import { appLimiter } from '@/presentation/http/express/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';

export class OAuthRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'oauth';

  constructor(private readonly oauthController: IOAuthController) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { getGoogleAuthUrl, googleLogin } = this.oauthController;

    this.router.get('/google/url', appLimiter, getGoogleAuthUrl);
    this.router.get('/google', appLimiter, asyncHandler(googleLogin));
  }
}
