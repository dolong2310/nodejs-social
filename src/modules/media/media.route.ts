/*
 * This file defines the media routes for uploading images, videos, and video streams.
 */

import { BaseRoute, MediaController, UsersValidation, protect } from '@/modules';
import { appLimiter } from '@/shared';
import { asyncHandler } from '@/utils';

export class MediaRoute extends BaseRoute {
  constructor() {
    super();
  }

  protected initializeRoutes(): void {
    const { uploadImage, uploadVideo, uploadVideoHLS, getVideoStatus } = this.container.get(MediaController);
    const { userVerifiedValidation } = this.container.get(UsersValidation);

    this.router.post('/upload-image', appLimiter, protect, userVerifiedValidation, asyncHandler(uploadImage));
    this.router.post('/upload-video', appLimiter, protect, userVerifiedValidation, asyncHandler(uploadVideo));
    this.router.post('/upload-video-hls', appLimiter, protect, userVerifiedValidation, asyncHandler(uploadVideoHLS));
    this.router.get('/video-status/:id', appLimiter, protect, userVerifiedValidation, asyncHandler(getVideoStatus));
  }
}

export function mediaRouter() {
  return new MediaRoute().getRouter();
}
