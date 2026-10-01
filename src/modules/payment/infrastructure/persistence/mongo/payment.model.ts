import { ENTITY_ID_LENGTH } from '@/modules/core/domain/helpers/ids';
import { PAYMENT_PROVIDERS, PAYMENT_STATUSES } from '@/modules/payment/domain/entities/payment.types';
import {
  type InferOutput,
  date,
  integer,
  literal,
  minLength,
  minValue,
  nullable,
  number,
  object,
  optional,
  picklist,
  pipe,
  string
} from 'valibot';

export const paymentSchema = object({
  _id: pipe(string(), minLength(ENTITY_ID_LENGTH)),
  user_id: pipe(string(), minLength(1)),
  source_type: literal('order'),
  source_reference: pipe(string(), minLength(1)),
  description: pipe(string(), minLength(1)),
  amount_vnd: pipe(number(), integer(), minValue(1)),
  currency: literal('VND'),
  provider: picklist(PAYMENT_PROVIDERS),
  provider_order_id: pipe(string(), minLength(1)),
  provider_request_id: pipe(string(), minLength(1)),
  idempotency_key: pipe(string(), minLength(1)),
  request_fingerprint: pipe(string(), minLength(1)),
  status: picklist(PAYMENT_STATUSES),
  checkout_url: nullable(string()),
  expires_at: nullable(date()),
  provider_transaction_id: nullable(string()),
  provider_result_code: nullable(string()),
  created_at: date(),
  created_by_id: optional(nullable(string()), null),
  updated_at: date(),
  updated_by_id: optional(nullable(string()), null),
  deleted_at: optional(nullable(date()), null),
  deleted_by_id: optional(nullable(string()), null),
  version: pipe(number(), integer(), minValue(0))
});

export type PaymentModel = InferOutput<typeof paymentSchema>;
