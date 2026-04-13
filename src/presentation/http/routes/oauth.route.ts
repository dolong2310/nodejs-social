import { IOAuthController } from '@/presentation/http/controllers/oauth.controller';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';

export class OAuthRoute extends BaseRoute {
  constructor(private readonly oauthController: IOAuthController) {
    super('/oauth');
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    const { getGoogleAuthUrl, googleLogin } = this.oauthController;

    this.router.get('/google/url', appLimiter, getGoogleAuthUrl);
    this.router.get('/google', appLimiter, asyncHandler(googleLogin));
  }
}
