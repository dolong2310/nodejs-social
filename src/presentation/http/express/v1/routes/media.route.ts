import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { asyncHandler } from '@/presentation/http/express/utils/async-handler.util';
import { IMediaController } from '@/presentation/http/express/v1/controllers/media.controller';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class MediaRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'media';

  constructor(
    private readonly mediaController: IMediaController,
    private readonly userPipe: IUserPipe,
    private readonly authGuard: AuthGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { uploadImage, uploadVideo, uploadVideoStream, getVideoStatus } = this.mediaController;
    const { userActivePipe } = this.userPipe;
    const authGuard = this.authGuard.handler;
    const throttler = this.throttlerGuard();

    this.router.post(
      '/upload-image',
      throttler,
      authGuard,
      userActivePipe,
      asyncHandler(this.transformInterceptor(uploadImage))
    );
    this.router.post(
      '/upload-video',
      throttler,
      authGuard,
      userActivePipe,
      asyncHandler(this.transformInterceptor(uploadVideo))
    );
    this.router.post(
      '/upload-video-stream',
      throttler,
      authGuard,
      userActivePipe,
      asyncHandler(this.transformInterceptor(uploadVideoStream))
    );
    this.router.get(
      '/video-status/:id',
      throttler,
      authGuard,
      userActivePipe,
      asyncHandler(this.transformInterceptor(getVideoStatus))
    );
  }
}
