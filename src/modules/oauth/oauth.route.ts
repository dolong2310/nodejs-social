/*
 * This file defines the oauth routes for google login.
 */

import { BaseRoute } from '@/modules/base/base.route';
import { OAuthController } from '@/modules/oauth/oauth.controller';
import { appLimiter } from '@/shared/middlewares/limiter.middleware';
import { asyncHandler } from '@/utils/handler.util';

class OAuthRoute extends BaseRoute {
  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    const { getGoogleAuthUrl, googleLogin } = this.container.get(OAuthController);

    this.router.get('/google/url', appLimiter, getGoogleAuthUrl);
    this.router.get('/google', appLimiter, asyncHandler(googleLogin));
  }
}

export function oauthRouter() {
  return new OAuthRoute().getRouter();
}
