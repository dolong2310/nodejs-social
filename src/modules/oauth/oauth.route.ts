/*
 * This file defines the oauth routes for google login.
 */

import { BaseRoute, OAuthController } from '@/modules';
import { appLimiter } from '@/shared';
import { asyncHandler } from '@/utils';

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
