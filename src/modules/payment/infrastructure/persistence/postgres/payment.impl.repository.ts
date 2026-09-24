import type { Pool } from 'pg';
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
import { PostgresPaymentMapper } from '@/modules/payment/infrastructure/persistence/postgres/payment.mapper';
import { PaymentModel } from '@/modules/payment/infrastructure/persistence/postgres/payment.model';

const MUTABLE_STATUSES: PaymentStatus[] = ['creating', 'pending', 'unknown'];
const URL_ATTACHABLE_STATUSES: PaymentStatus[] = [...MUTABLE_STATUSES, 'succeeded', 'failed', 'cancelled'];

export class PostgresPaymentRepository implements PaymentRepositoryPort {
  private readonly mapper = new PostgresPaymentMapper();

  constructor(private readonly pool: Pool) {}

  async insertOrFindByIdempotency(record: PaymentRecord): Promise<{ record: PaymentRecord; inserted: boolean }> {
    const model = this.mapper.toPersistence(record);
    const inserted = await this.pool.query<PaymentModel>(
      `
        INSERT INTO payments (
          id, user_id, source_type, source_reference, description, amount_vnd, currency, provider,
          provider_order_id, provider_request_id, idempotency_key, request_fingerprint, status,
          checkout_url, expires_at, provider_transaction_id, provider_result_code, created_at, updated_at, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20
        )
        ON CONFLICT (user_id, idempotency_key) DO NOTHING
        RETURNING *
      `,
      [
        model.id,
        model.user_id,
        model.source_type,
        model.source_reference,
        model.description,
        model.amount_vnd,
        model.currency,
        model.provider,
        model.provider_order_id,
        model.provider_request_id,
        model.idempotency_key,
        model.request_fingerprint,
        model.status,
        model.checkout_url,
        model.expires_at,
        model.provider_transaction_id,
        model.provider_result_code,
        model.created_at,
        model.updated_at,
        model.version
      ]
    );
    if (inserted.rows[0]) return { record: this.mapper.toDomain(inserted.rows[0]), inserted: true };

    const existing = await this.pool.query<PaymentModel>(
      'SELECT * FROM payments WHERE user_id = $1 AND idempotency_key = $2 LIMIT 1',
      [record.userId, record.idempotencyKey]
    );
    const existingRecord = existing.rows[0];
    if (!existingRecord) throw new Error('Idempotent payment insert conflicted without an existing payment');
    return { record: this.mapper.toDomain(existingRecord), inserted: false };
  }

  async findById(id: string): Promise<PaymentRecord | null> {
    const result = await this.pool.query<PaymentModel>('SELECT * FROM payments WHERE id = $1 LIMIT 1', [id]);
    return result.rows[0] ? this.mapper.toDomain(result.rows[0]) : null;
  }

  async findByProviderOrderId(provider: PaymentProvider, orderId: string): Promise<PaymentRecord | null> {
    const result = await this.pool.query<PaymentModel>(
      'SELECT * FROM payments WHERE provider = $1 AND provider_order_id = $2 LIMIT 1',
      [provider, orderId]
    );
    return result.rows[0] ? this.mapper.toDomain(result.rows[0]) : null;
  }

  async attachCheckoutUrlIfAbsent(id: string, url: string): Promise<PaymentRecord> {
    await this.pool.query(
      `
        UPDATE payments
        SET checkout_url = $2,
            status = CASE WHEN status = 'creating' THEN 'pending' ELSE status END,
            updated_at = NOW(),
            version = version + 1
        WHERE id = $1 AND checkout_url IS NULL AND status = ANY($3::text[])
      `,
      [id, url, URL_ATTACHABLE_STATUSES]
    );
    return this.requirePayment(id);
  }

  async setUnknownIfCreating(id: string): Promise<PaymentRecord> {
    await this.pool.query(
      "UPDATE payments SET status = 'unknown', updated_at = NOW(), version = version + 1 WHERE id = $1 AND status = 'creating'",
      [id]
    );
    return this.requirePayment(id);
  }

  async setCreateFailedIfCreating(id: string, resultCode: string): Promise<PaymentRecord> {
    await this.pool.query(
      "UPDATE payments SET status = 'create_failed', provider_result_code = $2, updated_at = NOW(), version = version + 1 WHERE id = $1 AND status = 'creating'",
      [id, resultCode]
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
      const result = await this.pool.query<PaymentModel>(
        `
          UPDATE payments
          SET status = $1,
              provider_transaction_id = $2,
              provider_result_code = $3,
              updated_at = NOW(),
              version = version + 1
          WHERE id = $4 AND version = $5 AND status = ANY($6::text[])
          RETURNING *
        `,
        [
          input.outcome,
          this.mapper.normalizeTransactionId(input.providerTransactionId),
          input.resultCode,
          current.id,
          current.version,
          MUTABLE_STATUSES
        ]
      );
      if (result.rows[0]) return 'applied';
    } catch (error) {
      if (isProviderTransactionUniqueViolation(error)) return 'state_conflict';
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
}

function isFinalStatus(status: PaymentStatus): status is 'succeeded' | 'failed' | 'cancelled' {
  return status === 'succeeded' || status === 'failed' || status === 'cancelled';
}

function isProviderTransactionUniqueViolation(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === '23505' &&
    'constraint' in error &&
    error.constraint === 'payments_provider_transaction_unique'
  );
}
