import { PaymentProvider, PaymentRecord, VerifiedNotification } from '@/modules/payment/domain/entities/payment.type';

export type ApplyVerifiedOutcomeResult =
  | 'applied'
  | 'duplicate'
  | 'not_found'
  | 'amount_mismatch'
  | 'reference_mismatch'
  | 'state_conflict';

export interface PaymentRepositoryPort {
  insertOrFindByIdempotency(record: PaymentRecord): Promise<{ record: PaymentRecord; inserted: boolean }>;
  findById(id: string): Promise<PaymentRecord | null>;
  findByProviderOrderId(provider: PaymentProvider, orderId: string): Promise<PaymentRecord | null>;
  attachCheckoutUrlIfAbsent(id: string, url: string): Promise<PaymentRecord>;
  setUnknownIfCreating(id: string): Promise<PaymentRecord>;
  setCreateFailedIfCreating(id: string, resultCode: string): Promise<PaymentRecord>;
  applyVerifiedOutcome(input: VerifiedNotification): Promise<ApplyVerifiedOutcomeResult>;
}
