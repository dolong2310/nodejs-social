import { USER_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/user.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import type { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import type { AuthOptionGuard } from '@/presentation/http/express/guards/auth-option.guard';
import type { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { IdempotencyInterceptor } from '@/presentation/http/express/interceptors/idempotency.interceptor';
import type { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import type { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import type { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import type { IUserController } from '@/presentation/http/express/v1/controllers/user.controller';
import type { IUserPipe } from '@/presentation/http/express/v1/pipes/user.pipe';

export class UserRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'users';

  constructor(
    private readonly userController: IUserController,
    private readonly userPipe: IUserPipe,
    private readonly authGuard: AuthGuard,
    private readonly authOptionGuard: AuthOptionGuard,
    private readonly activeUserGuard: ActiveUserGuard,
    private readonly throttlerGuard: ThrottlerProxyGuard,
    private readonly loggingInterceptor: LoggingInterceptor,
    private readonly transformResponseInterceptor: TransformResponseInterceptor,
    private readonly timeoutInterceptor: TimeoutInterceptor,
    private readonly idempotencyInterceptor: IdempotencyInterceptor
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const configs: RouterConfig[] = [
      {
        path: '/me',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(USER_THROTTLE_CONFIG.GET_ME)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.userController.getMe
      },
      {
        path: '/me',
        method: 'patch',
        middlewares: [this.throttlerGuard.handler(USER_THROTTLE_CONFIG.UPDATE_ME)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.userPipe.updateMePipe],
        controller: this.userController.updateMe
      },
      {
        path: '/:username',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(USER_THROTTLE_CONFIG.GET_PROFILE)],
        guards: [this.authOptionGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [],
        controller: this.userController.getUserProfile
      },
      {
        path: '/change-password',
        method: 'put',
        middlewares: [this.throttlerGuard.handler(USER_THROTTLE_CONFIG.CHANGE_PASSWORD)],
        guards: [this.authGuard, this.activeUserGuard],
        interceptors: [
          this.loggingInterceptor,
          this.transformResponseInterceptor,
          this.idempotencyInterceptor,
          this.timeoutInterceptor
        ],
        pipes: [this.userPipe.changePasswordPipe],
        controller: this.userController.changePassword
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
