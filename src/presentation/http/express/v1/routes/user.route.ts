import { THROTTLE } from '@/presentation/http/express/constants/throttler.constant';
import { BaseRoute } from '@/presentation/http/express/core/base.route';
import { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { IUserController } from '@/presentation/http/express/v1/controllers/user.controller';
import { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';

export class UserRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'users';

  constructor(
    private readonly userController: IUserController,
    private readonly userPipe: IUserPipe,
    private readonly authGuard: AuthGuard,
    private readonly authOptionGuard: AuthOptionGuard,
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
    const throttlerAuth = this.throttlerGuard.handler(THROTTLE.AUTH.WINDOW_MS, THROTTLE.AUTH.MAX);

    this.router.get(
      '/me',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe],
        controller: this.userController.getMe
      })
    );
    this.router.patch(
      '/me',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.userPipe.updateMePipe],
        controller: this.userController.updateMe
      })
    );
    this.router.get(
      '/:username',
      this.createRouteHandler({
        middlewares: [throttler],
        guards: [this.authOptionGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.userController.getUserProfile
      })
    );
    this.router.put(
      '/change-password',
      this.createRouteHandler({
        middlewares: [throttlerAuth],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [this.userPipe.userActivePipe, this.userPipe.changePasswordPipe],
        controller: this.userController.changePassword
      })
    );
  }
}
