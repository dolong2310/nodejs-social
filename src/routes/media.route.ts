/*
 * This file defines the media routes for uploading images, videos, and video streams.
 */

import { IMediaController } from '@/controllers/media.controller';
import { protect } from '@/middlewares/auth.middleware';
import { appLimiter } from '@/middlewares/limiter.middleware';
import { BaseRoute } from '@/routes/base.route';
import { asyncHandler } from '@/utils/handler.util';
import { IUsersValidation } from '@/validations/users.validation';

export class MediaRoute extends BaseRoute {
  private mediaController!: IMediaController;
  private usersValidation!: IUsersValidation;

  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    // Initialize the controller here, after the container is available
    this.mediaController = this.container.getMediaController();
    this.usersValidation = this.container.getUsersValidation();

    this.router.post(
      '/upload-image',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      asyncHandler(this.mediaController.uploadImage)
    );
    this.router.post(
      '/upload-video',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      asyncHandler(this.mediaController.uploadVideo)
    );
    this.router.post(
      '/upload-video-hls',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      asyncHandler(this.mediaController.uploadVideoHLS)
    );
    this.router.get(
      '/video-status/:id',
      appLimiter,
      protect,
      this.usersValidation.userVerifiedValidation,
      asyncHandler(this.mediaController.getVideoStatus)
    );
  }
}

// Create instance and export router for backward compatibility
export default () => {
  const mediaRoute = new MediaRoute();
  return mediaRoute.getRouter();
};
