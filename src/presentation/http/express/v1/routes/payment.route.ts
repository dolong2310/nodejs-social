import { PAYMENT_THROTTLE_CONFIG } from '@/presentation/http/express/constants/throttler/payment.throttler.constants';
import { BaseRoute, type RouterConfig } from '@/presentation/http/express/core/base.route';
import type { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import type { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import type { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import type { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import type { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import type { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import type { IPaymentController } from '@/presentation/http/express/v1/controllers/payment.controller';
import type { IPaymentPipe } from '@/presentation/http/express/v1/pipes/payment.pipe';

export class PaymentRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'payments';

  constructor(
    private readonly paymentController: IPaymentController,
    private readonly paymentPipe: IPaymentPipe,
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
    const guards = [this.authGuard, this.activeUserGuard];
    const interceptors = [this.loggingInterceptor, this.transformResponseInterceptor, this.timeoutInterceptor];

    const configs: RouterConfig[] = [
      {
        path: '/',
        method: 'post',
        middlewares: [this.throttlerGuard.handler(PAYMENT_THROTTLE_CONFIG.CREATE)],
        guards,
        interceptors,
        pipes: [this.paymentPipe.createPaymentPipe, this.paymentPipe.idempotencyKeyHeader],
        controller: this.paymentController.create
      },
      {
        path: '/:paymentId',
        method: 'get',
        middlewares: [this.throttlerGuard.handler(PAYMENT_THROTTLE_CONFIG.GET_BY_ID)],
        guards,
        interceptors,
        pipes: [this.paymentPipe.paymentIdParam],
        controller: this.paymentController.getById
      }
    ];

    configs.forEach(({ path, method, ...config }) => {
      this.router[method](path, this.createRouteHandler(config));
    });
  }
}
