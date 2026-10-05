import { AUTH_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/auth.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import type { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import type { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import type { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import type { IAuthController } from '@/presentation/http/express/v1/controllers/auth.controller';
import { validate } from '@/presentation/http/express/pipes/validation.pipe';
import {
  Disable2faBodySchema,
  ForgotPasswordBodySchema,
  LoginBodySchema,
  RegisterBodySchema,
  SendOtpBodySchema
} from '@/presentation/http/express/v1/schemas/auth/auth.request.schema';
import {
  AccessTokenResponseSchema,
  Enable2faResponseSchema
} from '@/presentation/http/express/v1/schemas/auth/auth.response.schema';
import { UserResponseSchema } from '@/presentation/http/express/v1/schemas/user/user.response.schema';

export class AuthRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'auth';

  constructor(
    private readonly authController: IAuthController,
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
    const configs: RouterConfig[] = [
      {
        path: '/register',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(AUTH_THROTTLE_CONFIG.REGISTER)],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ body: RegisterBodySchema })],
        response: UserResponseSchema,
        controller: this.authController.register
      },
      {
        path: '/login',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(AUTH_THROTTLE_CONFIG.LOGIN)],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ body: LoginBodySchema })],
        response: AccessTokenResponseSchema,
        controller: this.authController.login
      },
      {
        path: '/logout',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(AUTH_THROTTLE_CONFIG.LOGOUT)],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        controller: this.authController.logout
      },
      {
        path: '/refresh-token',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(AUTH_THROTTLE_CONFIG.REFRESH_TOKEN)],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        response: AccessTokenResponseSchema,
        controller: this.authController.refreshToken
      },
      {
        path: '/forgot-password',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(AUTH_THROTTLE_CONFIG.FORGOT_PASSWORD)],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ body: ForgotPasswordBodySchema })],
        controller: this.authController.forgotPassword
      },
      {
        path: '/otp',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(AUTH_THROTTLE_CONFIG.SEND_OTP)],
        guards: [],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ body: SendOtpBodySchema })],
        controller: this.authController.sendOtp
      },
      {
        path: '/2fa/enable',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(AUTH_THROTTLE_CONFIG.ENABLE_2FA)],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        response: Enable2faResponseSchema,
        controller: this.authController.enable2fa
      },
      {
        path: '/2fa/disable',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(AUTH_THROTTLE_CONFIG.DISABLE_2FA)],
        guards: [this.authGuard],
        interceptors: [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor],
        pipes: [validate({ body: Disable2faBodySchema })],
        controller: this.authController.disable2fa
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
