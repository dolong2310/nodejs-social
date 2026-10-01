import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { PostgresRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.postgres.repository';
import {
  classifyExistingPaymentNotification,
  MUTABLE_PAYMENT_STATUSES,
  normalizeProviderTransactionId,
  URL_ATTACHABLE_PAYMENT_STATUSES
} from '@/modules/payment/domain/helpers/payment.policy';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import { PaymentProvider, VerifiedNotification } from '@/modules/payment/domain/entities/payment.types';
import {
  ApplyVerifiedOutcomeResult,
  PaymentRepositoryPort
} from '@/modules/payment/domain/repositories/payment.repository';
import { PaymentMapper } from '@/modules/payment/infrastructure/persistence/postgres/payment.mapper';
import { PaymentModel } from '@/modules/payment/infrastructure/persistence/postgres/payment.model';
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

  async attachCheckoutUrlIfAbsent(id: string, url: string): Promise<PaymentEntity> {
    await this.query(
      `
        UPDATE payments
        SET checkout_url = $2,
            status = CASE WHEN status = 'creating' THEN 'pending' ELSE status END,
            updated_at = NOW(),
            updated_by_id = NULL,
            version = version + 1
        WHERE id = $1 AND checkout_url IS NULL AND status = ANY($3::text[]) AND deleted_at IS NULL
      `,
      [id, url, URL_ATTACHABLE_PAYMENT_STATUSES]
    );
    return this.requirePayment(id);
  }

  async setUnknownIfCreating(id: string): Promise<PaymentEntity> {
    await this.query(
      "UPDATE payments SET status = 'unknown', updated_at = NOW(), updated_by_id = NULL, version = version + 1 WHERE id = $1 AND status = 'creating' AND deleted_at IS NULL",
      [id]
    );
    return this.requirePayment(id);
  }

  async setCreateFailedIfCreating(id: string, resultCode: string): Promise<PaymentEntity> {
    await this.query(
      "UPDATE payments SET status = 'create_failed', provider_result_code = $2, updated_at = NOW(), updated_by_id = NULL, version = version + 1 WHERE id = $1 AND status = 'creating' AND deleted_at IS NULL",
      [id, resultCode]
    );
    return this.requirePayment(id);
  }

  async applyVerifiedOutcome(input: VerifiedNotification): Promise<ApplyVerifiedOutcomeResult> {
    const currentPayment = await this.findPaymentByProviderOrderId(input.provider, input.providerOrderId);
    if (!currentPayment) return 'not_found';
    const current = currentPayment.getProps();
    if (current.amountVnd !== input.amountVnd) return 'amount_mismatch';
    if (input.providerRequestId !== undefined && current.providerRequestId !== input.providerRequestId) {
      return 'reference_mismatch';
    }

    const existingResult = classifyExistingPaymentNotification(current, input);
    if (existingResult) return existingResult;

    try {
      const result = await this.query<PaymentModel>(
        `
          UPDATE payments
          SET status = $1,
              provider_transaction_id = $2,
              provider_result_code = $3,
              updated_at = NOW(),
              updated_by_id = NULL,
              version = version + 1
          WHERE id = $4 AND version = $5 AND status = ANY($6::text[]) AND deleted_at IS NULL
          RETURNING *
        `,
        [
          input.outcome,
          normalizeProviderTransactionId(input.providerTransactionId),
          input.resultCode,
          current.id.toString(),
          current.version,
          MUTABLE_PAYMENT_STATUSES
        ]
      );
      if (result.rows[0]) return 'applied';
    } catch (error) {
      if (isProviderTransactionUniqueViolation(error)) return 'state_conflict';
      throw error;
    }

    const latestPayment = await this.findById(current.id.toString());
    if (!latestPayment) return 'not_found';
    return classifyExistingPaymentNotification(latestPayment.getProps(), input) ?? 'state_conflict';
  }

  private async requirePayment(id: string): Promise<PaymentEntity> {
    const payment = await this.findPaymentById(id);
    if (!payment) throw new Error(`Payment ${id} was not found`);
    return payment;
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
