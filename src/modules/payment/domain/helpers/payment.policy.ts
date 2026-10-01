import {
  PaymentOutcome,
  PaymentProps,
  PaymentStatus,
  VerifiedNotification
} from '@/modules/payment/domain/entities/payment.types';

export const MUTABLE_PAYMENT_STATUSES: PaymentStatus[] = ['creating', 'pending', 'unknown'];
export const URL_ATTACHABLE_PAYMENT_STATUSES: PaymentStatus[] = [
  ...MUTABLE_PAYMENT_STATUSES,
  'succeeded',
  'failed',
  'cancelled'
];

export type ExistingPaymentNotificationResult = 'duplicate' | 'state_conflict' | null;

export function normalizeProviderTransactionId(value: string | null): string | null {
  return value === null || value.trim() === '' || value === '0' ? null : value;
}

export function isFinalPaymentStatus(status: PaymentStatus): status is 'succeeded' | 'failed' | 'cancelled' {
  return status === 'succeeded' || status === 'failed' || status === 'cancelled';
}

export function classifyExistingPaymentNotification(
  current: Pick<PaymentProps, 'status' | 'providerResultCode' | 'providerTransactionId'>,
  input: VerifiedNotification
): ExistingPaymentNotificationResult {
  if (current.status === 'create_failed') return 'state_conflict';
  if (isFinalPaymentStatus(current.status)) {
    if (input.outcome === 'pending') return 'duplicate';
    return isSamePaymentProviderResult(current, input) ? 'duplicate' : 'state_conflict';
  }
  if (current.status === 'pending' && input.outcome === 'pending' && isSamePaymentProviderResult(current, input)) {
    return 'duplicate';
  }
  if (!MUTABLE_PAYMENT_STATUSES.includes(current.status)) return 'state_conflict';
  return null;
}

function isSamePaymentProviderResult(
  current: Pick<PaymentProps, 'status' | 'providerResultCode' | 'providerTransactionId'>,
  input: VerifiedNotification
): boolean {
  const outcome: PaymentOutcome = input.outcome;
  return (
    current.status === outcome &&
    current.providerResultCode === input.resultCode &&
    current.providerTransactionId === normalizeProviderTransactionId(input.providerTransactionId)
  );
}
