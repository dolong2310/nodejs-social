import { THROTTLE } from '@/presentation/http/express/constants/throttler.constant';
import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IAuthController } from '@/presentation/http/express/v1/controllers/auth.controller';
import { IAuthPipe } from '@/presentation/http/express/v1/pipes/auth.pipe';

export class AuthRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'auth';

  constructor(
    private readonly authController: IAuthController,
    private readonly authPipe: IAuthPipe,
    private readonly authGuard: AuthGuard,
    private readonly throttlerGuard: ThrottlerProxyGuard,
    private readonly loggingInterceptor: LoggingInterceptor,
    private readonly transformResponseInterceptor: TransformResponseInterceptor,
    private readonly timeoutInterceptor: TimeoutInterceptor
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const throttler = this.throttlerGuard.handler(THROTTLE.AUTH.WINDOW_MS, THROTTLE.AUTH.MAX);

    this.router.post(
      '/register',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.authPipe.registerPipe],
        controller: this.authController.register
      })
    );
    this.router.post(
      '/login',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.authPipe.loginPipe],
        controller: this.authController.login
      })
    );
    this.router.post(
      '/logout',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.authController.logout
      })
    );
    this.router.get(
      '/refresh-token',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.authController.refreshToken
      })
    );
    this.router.post(
      '/forgot-password',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.authPipe.forgotPasswordPipe],
        controller: this.authController.forgotPassword
      })
    );
    this.router.post(
      '/otp',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.authPipe.sendOtpPipe],
        controller: this.authController.sendOtp
      })
    );
    this.router.post(
      '/2fa/enable',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.authController.enable2fa
      })
    );
    this.router.post(
      '/2fa/disable',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.authPipe.disable2faPipe],
        controller: this.authController.disable2fa
      })
    );
  }
}
