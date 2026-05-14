import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IMediaController } from '@/presentation/http/express/v1/controllers/media.controller';

export class StaticRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'static';

  constructor(
    private readonly mediaController: IMediaController,
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

    this.router.get(
      '/images/:filename',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.mediaController.getStaticImage
      })
    );
    // this.router.get('/videos/:filename', getStaticVideo);
    this.router.get(
      '/videos-stream/:filename',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.mediaController.getStaticVideoStream
      })
    );
    this.router.get(
      '/videos-stream/:id/master.m3u8',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.mediaController.getStaticVideoStreamMaster
      })
    );
    this.router.get(
      '/videos-stream/:id/:version/:segment',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.mediaController.getStaticVideoStreamSegment
      })
    );
  }
}
