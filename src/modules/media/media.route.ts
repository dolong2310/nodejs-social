/*
 * This file defines the media routes for uploading images, videos, and video streams.
 */

import { BaseRoute, IMediaController, IUsersValidation, protect } from '@/modules';
import { appLimiter } from '@/shared';
import { asyncHandler } from '@/utils';

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

export function mediaRouter() {
  return new MediaRoute().getRouter();
}
