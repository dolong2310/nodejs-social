/*
 * This file defines the oauth routes for google login.
 */

import { IOAuthController } from '@/controllers/oauth.controller';
import { appLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';

export class OAuthRoute extends BaseRoute {
  private oauthController!: IOAuthController;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    // Initialize the controller here, after the container is available
    this.oauthController = this.container.getOAuthController();

    this.router.get('/google', appLimiter, asyncHandler(this.oauthController.googleLogin));
  }
}

// Create instance and export router for backward compatibility
export default () => {
  const oauthRoute = new OAuthRoute();
  return oauthRoute.getRouter();
};
