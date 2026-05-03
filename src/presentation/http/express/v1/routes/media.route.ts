import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IMediaController } from '@/presentation/http/express/v1/controllers/media.controller';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';
import { IUserValidator } from '@/presentation/http/express/v1/validators/user.validator';

export class MediaRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'media';

  constructor(
    private readonly mediaController: IMediaController,
    private readonly userValidator: IUserValidator,
    private readonly authGuard: AuthGuard,
    private readonly throttler: ThrottlerProxyGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { uploadImage, uploadVideo, uploadVideoStream, getVideoStatus } = this.mediaController;
    const { userActiveValidator } = this.userValidator;
    const authGuard = this.authGuard.handler;
    const throttler = this.throttler.handler();

    this.router.post('/upload-image', throttler, authGuard, userActiveValidator, asyncHandler(uploadImage));
    this.router.post('/upload-video', throttler, authGuard, userActiveValidator, asyncHandler(uploadVideo));
    this.router.post('/upload-video-stream', throttler, authGuard, userActiveValidator, asyncHandler(uploadVideoStream));
    this.router.get('/video-status/:id', throttler, authGuard, userActiveValidator, asyncHandler(getVideoStatus));
  }
}
