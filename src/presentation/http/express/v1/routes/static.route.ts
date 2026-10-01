import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
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

    const configs: RouterConfig[] = [
      {
        path: '/images/:filename',
        method: 'get',
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.mediaController.getStaticImage
      },
      // this.router.get('/videos/:filename', getStaticVideo);
      {
        path: '/videos-stream/:filename',
        method: 'get',
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.mediaController.getStaticVideoStream
      },
      {
        path: '/videos-stream/:id/master.m3u8',
        method: 'get',
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.mediaController.getStaticVideoStreamMaster
      },
      {
        path: '/videos-stream/:id/:version/:segment',
        method: 'get',
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.mediaController.getStaticVideoStreamSegment
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
