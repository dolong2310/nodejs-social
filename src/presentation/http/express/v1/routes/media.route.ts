import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IMediaController } from '@/presentation/http/express/v1/controllers/media.controller';

export class MediaRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'media';

  constructor(
    private readonly mediaController: IMediaController,
    private readonly authGuard: AuthGuard,
    private readonly activeUserGuard: ActiveUserGuard,
    private readonly throttlerGuard: ThrottlerProxyGuard,
    private readonly loggingInterceptor: LoggingInterceptor,
    private readonly transformResponseInterceptor: TransformResponseInterceptor,
    private readonly timeoutInterceptor: TimeoutInterceptor
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const throttler = this.throttlerGuard.handler();

    this.router.post(
      '/upload-image',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.mediaController.uploadImage
      })
    );
    this.router.post(
      '/upload-video',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.mediaController.uploadVideo
      })
    );
    this.router.post(
      '/upload-video-stream',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.mediaController.uploadVideoStream
      })
    );
    this.router.get(
      '/video-status/:id',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.mediaController.getVideoStatus
      })
    );
  }
}
