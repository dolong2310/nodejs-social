import { PaymentCheckoutProps, VerifiedNotification } from '@/modules/payment/domain/entities/payment.type';

export type CheckoutCreationError =
  | { kind: 'definitive_rejection'; resultCode: string }
  | { kind: 'uncertain'; reason: 'timeout' | 'network' | 'unclassified' };

export interface PaymentGatewayPort {
  createCheckout(payment: PaymentCheckoutProps, clientIp: string): Promise<string>;
  verifyNotification(payload: unknown): VerifiedNotification;
}

export class PaymentCheckoutError extends Error {
  readonly classification: CheckoutCreationError;

  constructor(classification: CheckoutCreationError, message: string) {
    super(message);
    this.name = 'PaymentCheckoutError';
    this.classification = classification;
  }
}
