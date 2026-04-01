/*
 * This file defines the media routes for uploading images, videos, and video streams.
 */

import { protect } from '@/modules/auth/auth.middleware';
import { BaseRoute } from '@/modules/base/base.route';
import { MediaController } from '@/modules/media/media.controller';
import { UsersValidation } from '@/modules/users/users.validation';
import { appLimiter } from '@/shared/middlewares/limiter.middleware';
import { asyncHandler } from '@/utils/handler.util';

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
