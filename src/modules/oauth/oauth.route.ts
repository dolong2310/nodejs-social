/*
 * This file defines the oauth routes for google login.
 */

import { BaseRoute, IOAuthController } from '@/modules';
import { appLimiter } from '@/shared';
import { asyncHandler } from '@/utils';

class OAuthRoute extends BaseRoute {
  private oauthController!: IOAuthController;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    // Initialize the controller here, after the container is available
    this.oauthController = this.container.getOAuthController();

    this.router.get('/google/url', appLimiter, this.oauthController.getGoogleAuthUrl);
    this.router.get('/google', appLimiter, asyncHandler(this.oauthController.googleLogin));
  }
}

export function oauthRouter() {
  return new OAuthRoute().getRouter();
}
