import type { Collection, Db, MongoServerError } from 'mongodb';
import {
  PaymentProvider,
  PaymentRecord,
  PaymentStatus,
  VerifiedNotification
} from '@/modules/payment/domain/entities/payment.type';
import {
  ApplyVerifiedOutcomeResult,
  PaymentRepositoryPort
} from '@/modules/payment/domain/repositories/payment.repository';
import { MongoPaymentMapper } from '@/modules/payment/infrastructure/persistence/mongo/payment.mapper';
import { PaymentModel } from '@/modules/payment/infrastructure/persistence/mongo/payment.model';

const MUTABLE_STATUSES: PaymentStatus[] = ['creating', 'pending', 'unknown'];
const URL_ATTACHABLE_STATUSES: PaymentStatus[] = [...MUTABLE_STATUSES, 'succeeded', 'failed', 'cancelled'];

export class MongoPaymentRepository implements PaymentRepositoryPort {
  private readonly payments: Collection<PaymentModel>;
  private readonly mapper = new MongoPaymentMapper();

  constructor(private readonly db: Db) {
    this.payments = db.collection<PaymentModel>('payments');
  }

  async insertOrFindByIdempotency(record: PaymentRecord): Promise<{ record: PaymentRecord; inserted: boolean }> {
    const model = this.mapper.toPersistence(record);
    try {
      await this.payments.insertOne(model);
      return { record, inserted: true };
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) throw error;
      const existing = await this.payments.findOne({ user_id: record.userId, idempotency_key: record.idempotencyKey });
      if (!existing) throw error;
      return { record: this.mapper.toDomain(existing), inserted: false };
    }
  }

  async findById(id: string): Promise<PaymentRecord | null> {
    const record = await this.payments.findOne({ _id: id });
    return record ? this.mapper.toDomain(record) : null;
  }

  async findByProviderOrderId(provider: PaymentProvider, orderId: string): Promise<PaymentRecord | null> {
    const record = await this.payments.findOne({ provider, provider_order_id: orderId });
    return record ? this.mapper.toDomain(record) : null;
  }

  async attachCheckoutUrlIfAbsent(id: string, url: string): Promise<PaymentRecord> {
    await this.payments.updateOne(
      { _id: id, checkout_url: null, status: 'creating' },
      { $set: { checkout_url: url, status: 'pending', updated_at: new Date() }, $inc: { version: 1 } }
    );
    await this.payments.updateOne(
      {
        _id: id,
        checkout_url: null,
        status: { $in: URL_ATTACHABLE_STATUSES.filter((status) => status !== 'creating') }
      },
      { $set: { checkout_url: url, updated_at: new Date() }, $inc: { version: 1 } }
    );
    return this.requirePayment(id);
  }

  async setUnknownIfCreating(id: string): Promise<PaymentRecord> {
    await this.payments.updateOne(
      { _id: id, status: 'creating' },
      { $set: { status: 'unknown', updated_at: new Date() }, $inc: { version: 1 } }
    );
    return this.requirePayment(id);
  }

  async setCreateFailedIfCreating(id: string, resultCode: string): Promise<PaymentRecord> {
    await this.payments.updateOne(
      { _id: id, status: 'creating' },
      {
        $set: { status: 'create_failed', provider_result_code: resultCode, updated_at: new Date() },
        $inc: { version: 1 }
      }
    );
    return this.requirePayment(id);
  }

  async applyVerifiedOutcome(input: VerifiedNotification): Promise<ApplyVerifiedOutcomeResult> {
    const current = await this.findByProviderOrderId(input.provider, input.providerOrderId);
    if (!current) return 'not_found';
    if (current.amountVnd !== input.amountVnd) return 'amount_mismatch';
    if (input.providerRequestId !== undefined && current.providerRequestId !== input.providerRequestId) {
      return 'reference_mismatch';
    }

    const alreadyApplied = this.classifyExisting(current, input);
    if (alreadyApplied) return alreadyApplied;

    try {
      const updated = await this.payments.findOneAndUpdate(
        { _id: current.id, version: current.version, status: { $in: MUTABLE_STATUSES } },
        {
          $set: {
            status: input.outcome,
            provider_transaction_id: this.mapper.normalizeTransactionId(input.providerTransactionId),
            provider_result_code: input.resultCode,
            updated_at: new Date()
          },
          $inc: { version: 1 }
        },
        { returnDocument: 'after' }
      );
      if (updated) return 'applied';
    } catch (error) {
      if (this.isDuplicateKeyError(error)) return 'state_conflict';
      throw error;
    }

    const latest = await this.findById(current.id);
    if (!latest) return 'not_found';
    return this.classifyExisting(latest, input) ?? 'state_conflict';
  }

  private async requirePayment(id: string): Promise<PaymentRecord> {
    const record = await this.findById(id);
    if (!record) throw new Error(`Payment record ${id} was not found`);
    return record;
  }

  private classifyExisting(current: PaymentRecord, input: VerifiedNotification): 'duplicate' | 'state_conflict' | null {
    if (current.status === 'create_failed') return 'state_conflict';
    if (isFinalStatus(current.status)) {
      if (input.outcome === 'pending') return 'duplicate';
      return this.isSameProviderResult(current, input) ? 'duplicate' : 'state_conflict';
    }
    if (current.status === 'pending' && input.outcome === 'pending' && this.isSameProviderResult(current, input)) {
      return 'duplicate';
    }
    if (!MUTABLE_STATUSES.includes(current.status)) return 'state_conflict';
    return null;
  }

  private isSameProviderResult(current: PaymentRecord, input: VerifiedNotification): boolean {
    return (
      current.status === input.outcome &&
      current.providerResultCode === input.resultCode &&
      current.providerTransactionId === this.mapper.normalizeTransactionId(input.providerTransactionId)
    );
  }

  private isDuplicateKeyError(error: unknown): error is MongoServerError {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
}

function isFinalStatus(status: PaymentStatus): status is 'succeeded' | 'failed' | 'cancelled' {
  return status === 'succeeded' || status === 'failed' || status === 'cancelled';
}
