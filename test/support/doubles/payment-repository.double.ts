import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type { PaymentFullProps, PaymentProps, PaymentProvider } from '@/modules/payment/domain/entities/payment.types';
import {
  PaymentProviderTransactionConflictError,
  type PaymentRepositoryPort
} from '@/modules/payment/domain/repositories/payment.repository';

export function toPaymentEntity(payment: PaymentFullProps): PaymentEntity {
  const { id, createdAt, createdById, updatedAt, updatedById, deletedAt, deletedById, ...props } = payment;
  return new PaymentEntity({
    id: new UniqueEntityID(id),
    createdAt,
    createdById,
    updatedAt,
    updatedById,
    deletedAt,
    deletedById,
    props: props as PaymentProps
  });
}

/**
 * In-memory PaymentRepositoryPort with the same persistence guarantees as the real adapters:
 * optimistic locking on `version` and a unique provider transaction ID. Payment rules stay in the entity.
 */
export class InMemoryPaymentRepository implements PaymentRepositoryPort {
  readonly records = new Map<string, PaymentFullProps>();
  /** Order of persistence calls, for tests that assert sequencing. */
  readonly events: string[] = [];
  /** Every call fails, like an unavailable database. */
  failStorage = false;
  /** `save` reports a provider transaction ID conflict. */
  conflictOnSave = false;

  addRecord(payment: PaymentFullProps): void {
    this.records.set(payment.id, { ...payment });
  }

  statusOf(id: string): PaymentFullProps['status'] | undefined {
    return this.records.get(id)?.status;
  }

  expireCheckout(id: string): void {
    const record = this.requireRecord(id);
    this.records.set(id, { ...record, expiresAt: new Date(Date.now() - 1000) });
  }

  async insertOrFindByIdempotency(payment: PaymentEntity): Promise<{ payment: PaymentEntity; inserted: boolean }> {
    this.assertAvailable();
    const record = payment.toObject<PaymentFullProps>();
    const existing = [...this.records.values()].find(
      (candidate) => candidate.userId === record.userId && candidate.idempotencyKey === record.idempotencyKey
    );
    if (existing) return { payment: toPaymentEntity(existing), inserted: false };
    this.records.set(record.id, { ...record });
    this.events.push('persist');
    return { payment: toPaymentEntity(record), inserted: true };
  }

  async findPaymentById(id: string): Promise<PaymentEntity | null> {
    this.assertAvailable();
    const record = this.records.get(id);
    return record ? toPaymentEntity(record) : null;
  }

  async findPaymentByProviderOrderId(provider: PaymentProvider, orderId: string): Promise<PaymentEntity | null> {
    this.assertAvailable();
    const record = [...this.records.values()].find(
      (candidate) => candidate.provider === provider && candidate.providerOrderId === orderId
    );
    return record ? toPaymentEntity(record) : null;
  }

  async save(payment: PaymentEntity): Promise<PaymentEntity | null> {
    this.assertAvailable();
    if (this.conflictOnSave) throw new PaymentProviderTransactionConflictError();

    const next = payment.toObject<PaymentFullProps>();
    const stored = this.records.get(next.id);
    if (!stored || stored.version !== next.version) return null;

    const transactionTaken =
      next.providerTransactionId !== null &&
      [...this.records.values()].some(
        (record) =>
          record.id !== next.id &&
          record.provider === next.provider &&
          record.providerTransactionId === next.providerTransactionId
      );
    if (transactionTaken) throw new PaymentProviderTransactionConflictError();

    const saved: PaymentFullProps = { ...next, version: next.version + 1 };
    this.records.set(saved.id, saved);
    this.events.push('save');
    return toPaymentEntity(saved);
  }

  private assertAvailable(): void {
    if (this.failStorage) throw new Error('database unavailable');
  }

  private requireRecord(id: string): PaymentFullProps {
    const record = this.records.get(id);
    if (!record) throw new Error(`Missing test payment ${id}`);
    return record;
  }
}
