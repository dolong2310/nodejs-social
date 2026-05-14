import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IOAuthController } from '@/presentation/http/express/v1/controllers/oauth.controller';

export class OAuthRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'oauth';

  constructor(
    private readonly oauthController: IOAuthController,
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
      '/google/url',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.oauthController.getGoogleAuthUrl
      })
    );
    this.router.get(
      '/google',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.oauthController.googleLogin
      })
    );
  }
}
