import { PaymentNotificationVerificationError } from '@/modules/payment/application/exceptions/payment-notification.exception';
import { PaymentGatewayPort } from '@/modules/payment/application/ports/payment-gateway.port';
import {
  HandlePaymentNotificationCommand,
  HandlePaymentNotificationPort
} from '@/modules/payment/application/use-cases/handle-payment-notification/handle-payment-notification.port';
import { PaymentProvider, VerifiedNotification } from '@/modules/payment/domain/entities/payment.type';
import {
  ApplyVerifiedOutcomeResult,
  PaymentRepositoryPort
} from '@/modules/payment/domain/repositories/payment.repository';

export class HandlePaymentNotificationUseCase extends HandlePaymentNotificationPort {
  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly gateways: Record<PaymentProvider, PaymentGatewayPort>
  ) {
    super();
  }

  async execute({ provider, payload }: HandlePaymentNotificationCommand): Promise<ApplyVerifiedOutcomeResult> {
    const gateway = this.gateways[provider];
    if (!gateway) throw new PaymentNotificationVerificationError('invalid_payload');

    const notification = gateway.verifyNotification(payload);
    if (!isVerifiedNotification(provider, notification)) {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }

    return this.paymentRepository.applyVerifiedOutcome(notification);
  }
}

function isVerifiedNotification(provider: PaymentProvider, value: unknown): value is VerifiedNotification {
  if (typeof value !== 'object' || value === null) return false;
  const notification = value as Partial<VerifiedNotification>;
  return (
    notification.provider === provider &&
    typeof notification.providerOrderId === 'string' &&
    notification.providerOrderId.trim().length > 0 &&
    (notification.providerRequestId === undefined ||
      (typeof notification.providerRequestId === 'string' && notification.providerRequestId.trim().length > 0)) &&
    Number.isInteger(notification.amountVnd) &&
    (notification.amountVnd ?? 0) > 0 &&
    (notification.providerTransactionId === null || typeof notification.providerTransactionId === 'string') &&
    typeof notification.resultCode === 'string' &&
    notification.resultCode.trim().length > 0 &&
    ['pending', 'succeeded', 'failed', 'cancelled'].includes(notification.outcome ?? '')
  );
}
