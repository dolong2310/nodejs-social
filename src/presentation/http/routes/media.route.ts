import { IMediaController } from '@/presentation/http/controllers/media.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IUsersValidation } from '@/presentation/http/validators/users.validator';

export class MediaRoute extends BaseRoute {
  constructor(
    private readonly mediaController: IMediaController,
    private readonly usersValidation: IUsersValidation
  ) {
    super('/media');
    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    const { uploadImage, uploadVideo, uploadVideoHLS, getVideoStatus } = this.mediaController;
    const { userVerifiedValidation } = this.usersValidation;

    this.router.post('/upload-image', appLimiter, protect, userVerifiedValidation, asyncHandler(uploadImage));
    this.router.post('/upload-video', appLimiter, protect, userVerifiedValidation, asyncHandler(uploadVideo));
    this.router.post('/upload-video-hls', appLimiter, protect, userVerifiedValidation, asyncHandler(uploadVideoHLS));
    this.router.get('/video-status/:id', appLimiter, protect, userVerifiedValidation, asyncHandler(getVideoStatus));
  }
}
