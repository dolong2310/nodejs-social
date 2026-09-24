export type PaymentProvider = 'vnpay' | 'momo';

export type PaymentStatus = 'creating' | 'pending' | 'unknown' | 'create_failed' | 'succeeded' | 'failed' | 'cancelled';

export type PaymentOutcome = 'pending' | 'succeeded' | 'failed' | 'cancelled';

export interface PaymentRecord {
  id: string;
  userId: string;
  sourceType: 'example';
  sourceReference: string;
  description: string;
  amountVnd: number;
  currency: 'VND';
  provider: PaymentProvider;
  providerOrderId: string;
  providerRequestId: string;
  idempotencyKey: string;
  requestFingerprint: string;
  status: PaymentStatus;
  checkoutUrl: string | null;
  expiresAt: Date | null;
  providerTransactionId: string | null;
  providerResultCode: string | null;
  createdAt: Date;
  updatedAt: Date;
  version: number;
}

export interface VerifiedNotification {
  provider: PaymentProvider;
  providerOrderId: string;
  providerRequestId?: string;
  amountVnd: number;
  providerTransactionId: string | null;
  resultCode: string;
  outcome: PaymentOutcome;
}
