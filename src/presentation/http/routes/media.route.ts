import { IMediaController } from '@/presentation/http/controllers/media.controller';
import { protect } from '@/presentation/http/middlewares/auth.middleware';
import { appLimiter } from '@/presentation/http/middlewares/limiter.middleware';
import { BaseRoute } from '@/presentation/http/routes/base.route';
import { asyncHandler } from '@/presentation/http/utils/async-handler.util';
import { IUserValidator } from '@/presentation/http/validators/user.validator';

export class MediaRoute extends BaseRoute {
  protected override readonly pathName = '/media';

  constructor(
    private readonly mediaController: IMediaController,
    private readonly userValidator: IUserValidator
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { uploadImage, uploadVideo, uploadVideoStream, getVideoStatus } = this.mediaController;
    const { userVerifiedValidator } = this.userValidator;

    this.router.post('/upload-image', appLimiter, protect, userVerifiedValidator, asyncHandler(uploadImage));
    this.router.post('/upload-video', appLimiter, protect, userVerifiedValidator, asyncHandler(uploadVideo));
    this.router.post(
      '/upload-video-stream',
      appLimiter,
      protect,
      userVerifiedValidator,
      asyncHandler(uploadVideoStream)
    );
    this.router.get('/video-status/:id', appLimiter, protect, userVerifiedValidator, asyncHandler(getVideoStatus));
  }
}
