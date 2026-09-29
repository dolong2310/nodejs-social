import type { PaymentConfig } from '@/bootstrap/config/payment.config';
import { CreatePaymentUseCase } from '@/modules/payment/application/use-cases/create-payment/create-payment.usecase';
import { GetPaymentUseCase } from '@/modules/payment/application/use-cases/get-payment/get-payment.usecase';
import { HandlePaymentNotificationUseCase } from '@/modules/payment/application/use-cases/handle-payment-notification/handle-payment-notification.usecase';
import type { PaymentGatewayPort } from '@/modules/payment/application/ports/payment-gateway.port';
import type { PaymentProvider } from '@/modules/payment/domain/entities/payment.type';
import type { PaymentRepositoryPort } from '@/modules/payment/domain/repositories/payment.repository';
import { MomoPaymentGatewayAdapter } from '@/modules/payment/infrastructure/gateways/momo-payment-gateway.adapter';
import { VnpayPaymentGatewayAdapter } from '@/modules/payment/infrastructure/gateways/vnpay-payment-gateway.adapter';
import { ActiveUserGuard } from '@/presentation/http/express/guards/active-user.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { ThrottlerProxyGuard } from '@/presentation/http/express/guards/throttler-proxy.guard';
import { LoggingInterceptor } from '@/presentation/http/express/interceptors/logging.interceptor';
import { TimeoutInterceptor } from '@/presentation/http/express/interceptors/timeout.interceptor';
import { TransformResponseInterceptor } from '@/presentation/http/express/interceptors/transform-response.interceptor';
import { PaymentCallbackController } from '@/presentation/http/express/v1/controllers/payment-callback.controller';
import { PaymentController } from '@/presentation/http/express/v1/controllers/payment.controller';
import { PaymentsPipe } from '@/presentation/http/express/v1/pipes/payment.pipe';
import { PaymentCallbackRoute } from '@/presentation/http/express/v1/routes/payment-callback.route';
import { PaymentRoute } from '@/presentation/http/express/v1/routes/payment.route';
import { BaseRoute } from '@/presentation/http/express/core/base.route';

const PAYMENT_HTTP_TIMEOUT_MS = 45_000;

export interface PaymentModuleDependencies {
  paymentRepository: PaymentRepositoryPort;
  paymentConfig: PaymentConfig;
  authGuard: AuthGuard;
  activeUserGuard: ActiveUserGuard;
  throttlerGuard: ThrottlerProxyGuard;
  loggingInterceptor: LoggingInterceptor;
  transformResponseInterceptor: TransformResponseInterceptor;
}

export function buildPaymentModule(dependencies: PaymentModuleDependencies): BaseRoute[] {
  const gateways: Record<PaymentProvider, PaymentGatewayPort> = {
    vnpay: new VnpayPaymentGatewayAdapter({
      ...dependencies.paymentConfig.vnpay,
      paymentPublicBaseUrl: dependencies.paymentConfig.paymentPublicBaseUrl
    }),
    momo: new MomoPaymentGatewayAdapter({
      ...dependencies.paymentConfig.momo,
      paymentPublicBaseUrl: dependencies.paymentConfig.paymentPublicBaseUrl
    })
  };
  const createPaymentUC = new CreatePaymentUseCase(dependencies.paymentRepository, gateways);
  const getPaymentUC = new GetPaymentUseCase(dependencies.paymentRepository);
  const handlePaymentNotification = new HandlePaymentNotificationUseCase(dependencies.paymentRepository, gateways);
  const paymentController = new PaymentController(createPaymentUC, getPaymentUC);
  const paymentCallbackController = new PaymentCallbackController(handlePaymentNotification);
  const paymentTimeoutInterceptor = new TimeoutInterceptor({ timeoutMs: PAYMENT_HTTP_TIMEOUT_MS });

  return [
    new PaymentRoute(
      paymentController,
      new PaymentsPipe(),
      dependencies.authGuard,
      dependencies.activeUserGuard,
      dependencies.throttlerGuard,
      dependencies.loggingInterceptor,
      dependencies.transformResponseInterceptor,
      paymentTimeoutInterceptor
    ),
    new PaymentCallbackRoute(paymentCallbackController)
  ];
}
