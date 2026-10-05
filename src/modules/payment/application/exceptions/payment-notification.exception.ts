export type PaymentNotificationVerificationReason = 'invalid_payload' | 'invalid_signature' | 'merchant_mismatch';

export class PaymentNotificationVerificationError extends Error {
  constructor(
    readonly reason: PaymentNotificationVerificationReason,
    message = 'Payment notification could not be verified'
  ) {
    super(message);
    this.name = 'PaymentNotificationVerificationError';
  }
}
