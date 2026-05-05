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

    this.router.get('/google/url', throttler, this.interceptor(getGoogleAuthUrl));
    this.router.get('/google', throttler, this.interceptor(googleLogin));
  }
}
