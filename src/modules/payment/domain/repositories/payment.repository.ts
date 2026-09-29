import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import { PaymentProvider, VerifiedNotification } from '@/modules/payment/domain/entities/payment.type';

export type ApplyVerifiedOutcomeResult =
  | 'applied'
  | 'duplicate'
  | 'not_found'
  | 'amount_mismatch'
  | 'reference_mismatch'
  | 'state_conflict';

export interface PaymentRepositoryPort {
  insertOrFindByIdempotency(payment: PaymentEntity): Promise<{ payment: PaymentEntity; inserted: boolean }>;
  findPaymentById(id: string): Promise<PaymentEntity | null>;
  findPaymentByProviderOrderId(provider: PaymentProvider, orderId: string): Promise<PaymentEntity | null>;
  attachCheckoutUrlIfAbsent(id: string, url: string): Promise<PaymentEntity>;
  setUnknownIfCreating(id: string): Promise<PaymentEntity>;
  setCreateFailedIfCreating(id: string, resultCode: string): Promise<PaymentEntity>;
  applyVerifiedOutcome(input: VerifiedNotification): Promise<ApplyVerifiedOutcomeResult>;
}
