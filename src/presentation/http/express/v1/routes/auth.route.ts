import { THROTTLE } from '@/presentation/http/express/constants/throttler.constant';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
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

    const configs: RouterConfig[] = [
      {
        path: '/register',
        method: 'post',
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.authPipe.registerPipe],
        controller: this.authController.register
      },
      {
        path: '/login',
        method: 'post',
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.authPipe.loginPipe],
        controller: this.authController.login
      },
      {
        path: '/logout',
        method: 'post',
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.authController.logout
      },
      {
        path: '/refresh-token',
        method: 'get',
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.authController.refreshToken
      },
      {
        path: '/forgot-password',
        method: 'post',
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.authPipe.forgotPasswordPipe],
        controller: this.authController.forgotPassword
      },
      {
        path: '/otp',
        method: 'post',
        middlewares: [throttler],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.authPipe.sendOtpPipe],
        controller: this.authController.sendOtp
      },
      {
        path: '/2fa/enable',
        method: 'post',
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.authController.enable2fa
      },
      {
        path: '/2fa/disable',
        method: 'post',
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.authPipe.disable2faPipe],
        controller: this.authController.disable2fa
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
