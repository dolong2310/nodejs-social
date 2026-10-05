import { PaymentNotificationVerificationError } from '@/modules/payment/application/exceptions/payment-notification.exception';
import type { PaymentGatewayPort } from '@/modules/payment/application/ports/payment-gateway.port';
import {
  type HandlePaymentNotificationInputPort,
  HandlePaymentNotificationPort,
  type HandlePaymentNotificationResult
} from '@/modules/payment/application/use-cases/handle-payment-notification/handle-payment-notification.port';
import type { PaymentProvider, VerifiedNotification } from '@/modules/payment/domain/entities/payment.types';
import {
  PaymentProviderTransactionConflictError,
  type PaymentRepositoryPort
} from '@/modules/payment/domain/repositories/payment.repository';

// A version conflict means another write landed between load and save; the rules are re-run on the latest state.
const MAX_SAVE_ATTEMPTS = 3;

export class HandlePaymentNotificationUseCase extends HandlePaymentNotificationPort {
  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly gateways: Record<PaymentProvider, PaymentGatewayPort>
  ) {
    super();
  }

  async execute(input: HandlePaymentNotificationInputPort): Promise<HandlePaymentNotificationResult> {
    const { provider, payload } = input;
    const gateway = this.gateways[provider];
    if (!gateway) throw new PaymentNotificationVerificationError('invalid_payload');

    const notification = gateway.verifyNotification(payload);
    if (!isVerifiedNotification(provider, notification)) {
      throw new PaymentNotificationVerificationError('invalid_payload');
    }

    for (let attempt = 0; attempt < MAX_SAVE_ATTEMPTS; attempt++) {
      const payment = await this.paymentRepository.findPaymentByProviderOrderId(
        notification.provider,
        notification.providerOrderId
      );
      if (!payment) return 'not_found';

      const result = payment.applyVerifiedOutcome(notification);
      if (result !== 'applied') return result;

      try {
        if (await this.paymentRepository.save(payment)) return 'applied';
      } catch (error) {
        // Another order already stored this provider transaction ID.
        if (error instanceof PaymentProviderTransactionConflictError) return 'state_conflict';
        throw error;
      }
    }
    return 'state_conflict';
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
