import { PaymentRecord } from '@/modules/payment/domain/entities/payment.type';
import { PaymentModel } from '@/modules/payment/infrastructure/persistence/postgres/payment.model';

export class PostgresPaymentMapper {
  toPersistence(payment: PaymentRecord): PaymentModel {
    return {
      id: payment.id,
      user_id: payment.userId,
      source_type: payment.sourceType,
      source_reference: payment.sourceReference,
      description: payment.description,
      amount_vnd: payment.amountVnd,
      currency: payment.currency,
      provider: payment.provider,
      provider_order_id: payment.providerOrderId,
      provider_request_id: payment.providerRequestId,
      idempotency_key: payment.idempotencyKey,
      request_fingerprint: payment.requestFingerprint,
      status: payment.status,
      checkout_url: payment.checkoutUrl,
      expires_at: payment.expiresAt,
      provider_transaction_id: this.normalizeTransactionId(payment.providerTransactionId),
      provider_result_code: payment.providerResultCode,
      created_at: payment.createdAt,
      updated_at: payment.updatedAt,
      version: payment.version
    };
  }

  toDomain(record: PaymentModel): PaymentRecord {
    return {
      id: record.id,
      userId: record.user_id,
      sourceType: record.source_type,
      sourceReference: record.source_reference,
      description: record.description,
      amountVnd: Number(record.amount_vnd),
      currency: record.currency,
      provider: record.provider,
      providerOrderId: record.provider_order_id,
      providerRequestId: record.provider_request_id,
      idempotencyKey: record.idempotency_key,
      requestFingerprint: record.request_fingerprint,
      status: record.status as PaymentRecord['status'],
      checkoutUrl: record.checkout_url,
      expiresAt: record.expires_at,
      providerTransactionId: this.normalizeTransactionId(record.provider_transaction_id),
      providerResultCode: record.provider_result_code,
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      version: Number(record.version)
    };
  }

  normalizeTransactionId(value: string | null): string | null {
    return value === null || value.trim() === '' || value === '0' ? null : value;
  }
}
