import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import { PaymentProps, PaymentSafeProps } from '@/modules/payment/domain/entities/payment.type';
import { normalizeProviderTransactionId } from '@/modules/payment/domain/helpers/payment.policy';
import { type PaymentModel, paymentSchema } from '@/modules/payment/infrastructure/persistence/mongo/payment.model';
import { parse } from 'valibot';

export class PaymentMapper implements Mapper<PaymentEntity, PaymentModel, PaymentSafeProps> {
  toPersistence(entity: PaymentEntity): PaymentModel {
    const payment = entity.getProps();
    const record: PaymentModel = {
      _id: payment.id.toString(),
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
      provider_transaction_id: normalizeProviderTransactionId(payment.providerTransactionId),
      provider_result_code: payment.providerResultCode,
      created_at: payment.createdAt,
      created_by_id: payment.createdById ?? null,
      updated_at: payment.updatedAt,
      updated_by_id: payment.updatedById ?? null,
      deleted_at: payment.deletedAt ?? null,
      deleted_by_id: payment.deletedById ?? null,
      version: payment.version
    };
    return parse(paymentSchema, record);
  }

  toDomain(record: PaymentModel): PaymentEntity {
    const payment = parse(paymentSchema, record);
    const props: PaymentProps = {
      userId: payment.user_id,
      sourceType: payment.source_type,
      sourceReference: payment.source_reference,
      description: payment.description,
      amountVnd: payment.amount_vnd,
      currency: payment.currency,
      provider: payment.provider,
      providerOrderId: payment.provider_order_id,
      providerRequestId: payment.provider_request_id,
      idempotencyKey: payment.idempotency_key,
      requestFingerprint: payment.request_fingerprint,
      status: payment.status,
      checkoutUrl: payment.checkout_url,
      expiresAt: payment.expires_at,
      providerTransactionId: normalizeProviderTransactionId(payment.provider_transaction_id),
      providerResultCode: payment.provider_result_code,
      version: payment.version
    };
    return new PaymentEntity({
      id: new UniqueEntityID(payment._id),
      createdAt: payment.created_at,
      createdById: payment.created_by_id ?? null,
      updatedAt: payment.updated_at,
      updatedById: payment.updated_by_id ?? null,
      deletedAt: payment.deleted_at ?? null,
      deletedById: payment.deleted_by_id ?? null,
      props
    });
  }

  toResponse(record: PaymentModel): PaymentSafeProps {
    const payment = parse(paymentSchema, record);
    const response: PaymentSafeProps = {
      id: payment._id,
      sourceReference: payment.source_reference,
      description: payment.description,
      amountVnd: payment.amount_vnd,
      currency: payment.currency,
      provider: payment.provider,
      status: payment.status,
      checkoutUrl: payment.checkout_url,
      expiresAt: payment.expires_at,
      createdAt: payment.created_at,
      updatedAt: payment.updated_at
    };
    return response;
  }
}
