import type { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type { PaymentProvider } from '@/modules/payment/domain/entities/payment.types';

/** Thrown by `save` when the provider transaction ID is already stored on another payment. */
export class PaymentProviderTransactionConflictError extends Error {
  constructor(options?: ErrorOptions) {
    super('Provider transaction ID is already used by another payment', options);
    this.name = 'PaymentProviderTransactionConflictError';
  }
}

export interface PaymentRepositoryPort {
  insertOrFindByIdempotency(payment: PaymentEntity): Promise<{ payment: PaymentEntity; inserted: boolean }>;
  findPaymentById(id: string): Promise<PaymentEntity | null>;
  findPaymentByProviderOrderId(provider: PaymentProvider, orderId: string): Promise<PaymentEntity | null>;
  /**
   * Persists the state changed by the entity's domain methods, with optimistic locking on `version`.
   * Returns the saved payment, or null when another write changed it since it was loaded (reload and retry).
   * @throws PaymentProviderTransactionConflictError when the provider transaction ID belongs to another payment.
   */
  save(payment: PaymentEntity): Promise<PaymentEntity | null>;
}
