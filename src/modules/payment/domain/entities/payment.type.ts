import { BaseEntityProps } from '@/modules/core/domain/entities/base.entity';
import type { Prettify } from 'ts-essentials';

export type PaymentProvider = 'vnpay' | 'momo';

export const PAYMENT_PROVIDERS = ['vnpay', 'momo'] as const;

export const PAYMENT_STATUSES = [
  'creating',
  'pending',
  'unknown',
  'create_failed',
  'succeeded',
  'failed',
  'cancelled'
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export type PaymentOutcome = 'pending' | 'succeeded' | 'failed' | 'cancelled';

export interface PaymentProps {
  userId: string;
  sourceType: 'order';
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
  version: number;
}

export interface PaymentFullProps extends Prettify<PaymentProps & Omit<BaseEntityProps, 'id'> & { id: string }> {}

export interface PaymentSafeProps extends Pick<
  PaymentFullProps,
  | 'id'
  | 'sourceReference'
  | 'description'
  | 'amountVnd'
  | 'currency'
  | 'provider'
  | 'status'
  | 'checkoutUrl'
  | 'expiresAt'
  | 'createdAt'
  | 'updatedAt'
> {}

export type PaymentCheckoutProps = Pick<
  PaymentFullProps,
  'provider' | 'description' | 'amountVnd' | 'providerOrderId' | 'providerRequestId' | 'createdAt' | 'expiresAt'
>;

export interface CreatePaymentProps {
  userId: string;
  provider: PaymentProvider;
  idempotencyKey: string;
  now?: Date;
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
