import { PAYMENT_PROVIDERS, PAYMENT_STATUSES } from '@/modules/payment/domain/entities/payment.types';
import { type InferOutput, literal, nullable, number, object, picklist, pipe, string, transform } from 'valibot';
import { responseDateSchema } from '@/presentation/http/express/v1/schemas/common/response.schema';

/**
 * Maps `PaymentSafeProps` to the public payment shape:
 * `id` → `paymentId`, and an expired checkout URL is hidden.
 */
export const PaymentResponseSchema = pipe(
  object({
    id: string(),
    sourceReference: string(),
    description: string(),
    amountVnd: number(),
    currency: literal('VND'),
    provider: picklist(PAYMENT_PROVIDERS),
    status: picklist(PAYMENT_STATUSES),
    checkoutUrl: nullable(string()),
    expiresAt: nullable(responseDateSchema),
    createdAt: responseDateSchema,
    updatedAt: responseDateSchema
  }),
  transform(({ id, checkoutUrl, expiresAt, ...payment }) => ({
    paymentId: id,
    ...payment,
    checkoutUrl: expiresAt && expiresAt.getTime() <= Date.now() ? null : checkoutUrl,
    expiresAt
  }))
);
export type PaymentResponse = InferOutput<typeof PaymentResponseSchema>;
