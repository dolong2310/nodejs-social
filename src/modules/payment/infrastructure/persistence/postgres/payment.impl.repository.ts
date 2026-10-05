import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import type { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type { PaymentProvider } from '@/modules/payment/domain/entities/payment.types';
import {
  PaymentProviderTransactionConflictError,
  type PaymentRepositoryPort
} from '@/modules/payment/domain/repositories/payment.repository';
import type { PaymentMapper } from '@/modules/payment/infrastructure/persistence/postgres/payment.mapper';
import type { PaymentModel } from '@/modules/payment/infrastructure/persistence/postgres/payment.model';
import type { Pool } from 'pg';

export class PaymentRepository
  extends PostgresRepositoryBase<PaymentEntity, PaymentModel>
  implements PaymentRepositoryPort
{
  protected tableName = 'payments';

  constructor(
    protected readonly pool: Pool,
    protected readonly mapper: PaymentMapper,
    protected readonly logger: LoggerPort
  ) {
    super(pool, mapper);
  }

  async insertOrFindByIdempotency(payment: PaymentEntity): Promise<{ payment: PaymentEntity; inserted: boolean }> {
    const model = this.mapper.toPersistence(payment);
    const inserted = await this.query<PaymentModel>(
      `
        INSERT INTO payments (
          id, user_id, source_type, source_reference, description, amount_vnd, currency, provider,
          provider_order_id, provider_request_id, idempotency_key, request_fingerprint, status,
          checkout_url, expires_at, provider_transaction_id, provider_result_code, created_at,
          created_by_id, updated_at, updated_by_id, deleted_at, deleted_by_id, version
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
          $18, $19, $20, $21, $22, $23, $24
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
        model.created_by_id,
        model.updated_at,
        model.updated_by_id,
        model.deleted_at,
        model.deleted_by_id,
        model.version
      ]
    );
    if (inserted.rows[0]) return { payment: this.mapper.toDomain(inserted.rows[0]), inserted: true };

    const existingPayment = await this.findOne({
      userId: payment.getProps().userId,
      idempotencyKey: payment.getProps().idempotencyKey
    } as Partial<PaymentEntity>);
    if (!existingPayment) throw new Error('Idempotent payment insert conflicted without an existing payment');
    return { payment: existingPayment, inserted: false };
  }

  async findPaymentById(id: string): Promise<PaymentEntity | null> {
    return this.findById(id);
  }

  async findPaymentByProviderOrderId(provider: PaymentProvider, orderId: string): Promise<PaymentEntity | null> {
    return this.findOne({ provider, providerOrderId: orderId } as Partial<PaymentEntity>);
  }

  async save(payment: PaymentEntity): Promise<PaymentEntity | null> {
    const model = this.mapper.toPersistence(payment);
    try {
      // Only the state changed by the entity's domain methods; the version check rejects stale writes.
      const result = await this.query<PaymentModel>(
        `
          UPDATE payments
          SET status = $1,
              checkout_url = $2,
              provider_transaction_id = $3,
              provider_result_code = $4,
              updated_at = $5,
              updated_by_id = $6,
              version = version + 1
          WHERE id = $7 AND version = $8 AND deleted_at IS NULL
          RETURNING *
        `,
        [
          model.status,
          model.checkout_url,
          model.provider_transaction_id,
          model.provider_result_code,
          model.updated_at,
          model.updated_by_id,
          model.id,
          model.version
        ]
      );
      const [saved] = result.rows;
      return saved ? this.mapper.toDomain(saved) : null;
    } catch (error) {
      if (isProviderTransactionUniqueViolation(error)) {
        throw new PaymentProviderTransactionConflictError({ cause: error });
      }
      throw error;
    }
  }
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
