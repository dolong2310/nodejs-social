import {
  MAX_PAYMENT_AMOUNT_VND,
  MAX_PAYMENT_DESCRIPTION_LENGTH,
  MAX_PAYMENT_SOURCE_REFERENCE_LENGTH,
  MIN_PAYMENT_AMOUNT_VND,
  PAYMENT_PROVIDERS
} from '@/modules/payment/domain/entities/payment.types';
import { VALIDATION_ERROR_MESSAGE } from '@/presentation/http/express/constants/message.constants';
import { requestObject, requiredString } from '@/presentation/http/express/utils/schema.util';
import { idSchema } from '@/presentation/http/express/v1/schemas/common/primitives.schema';
import {
  digits,
  integer,
  looseObject,
  maxLength,
  maxValue,
  minValue,
  nonEmpty,
  number,
  picklist,
  pipe,
  string,
  toNumber,
  trim,
  union
} from 'valibot';

/** Accepts a JSON number or a numeric string (form posts), always outputs a number. */
const amountVndSchema = pipe(
  union([number(), pipe(string(), trim(), digits(), toNumber())], (issue) =>
    issue.input === undefined
      ? VALIDATION_ERROR_MESSAGE.PAYMENT_AMOUNT_IS_REQUIRED
      : VALIDATION_ERROR_MESSAGE.PAYMENT_AMOUNT_INVALID
  ),
  integer(VALIDATION_ERROR_MESSAGE.PAYMENT_AMOUNT_INVALID),
  minValue(MIN_PAYMENT_AMOUNT_VND, VALIDATION_ERROR_MESSAGE.PAYMENT_AMOUNT_INVALID),
  maxValue(MAX_PAYMENT_AMOUNT_VND, VALIDATION_ERROR_MESSAGE.PAYMENT_AMOUNT_INVALID)
);

export const CreatePaymentBodySchema = requestObject({
  provider: pipe(
    requiredString({
      required: VALIDATION_ERROR_MESSAGE.PAYMENT_PROVIDER_IS_REQUIRED,
      invalid: VALIDATION_ERROR_MESSAGE.PAYMENT_PROVIDER_INVALID
    }),
    picklist(PAYMENT_PROVIDERS, VALIDATION_ERROR_MESSAGE.PAYMENT_PROVIDER_INVALID)
  ),
  sourceReference: pipe(
    requiredString({
      required: VALIDATION_ERROR_MESSAGE.PAYMENT_SOURCE_REFERENCE_IS_REQUIRED,
      invalid: VALIDATION_ERROR_MESSAGE.PAYMENT_SOURCE_REFERENCE_MUST_BE_A_STRING
    }),
    trim(),
    nonEmpty(VALIDATION_ERROR_MESSAGE.PAYMENT_SOURCE_REFERENCE_IS_REQUIRED),
    maxLength(MAX_PAYMENT_SOURCE_REFERENCE_LENGTH, VALIDATION_ERROR_MESSAGE.PAYMENT_SOURCE_REFERENCE_LENGTH_INVALID)
  ),
  description: pipe(
    requiredString({
      required: VALIDATION_ERROR_MESSAGE.PAYMENT_DESCRIPTION_IS_REQUIRED,
      invalid: VALIDATION_ERROR_MESSAGE.PAYMENT_DESCRIPTION_MUST_BE_A_STRING
    }),
    trim(),
    nonEmpty(VALIDATION_ERROR_MESSAGE.PAYMENT_DESCRIPTION_IS_REQUIRED),
    maxLength(MAX_PAYMENT_DESCRIPTION_LENGTH, VALIDATION_ERROR_MESSAGE.PAYMENT_DESCRIPTION_LENGTH_INVALID)
  ),
  amountVnd: amountVndSchema
});

/** Headers are only validated (never replaced); `looseObject` keeps every other header. */
export const IdempotencyKeyHeadersSchema = looseObject({
  'idempotency-key': pipe(
    requiredString({
      required: VALIDATION_ERROR_MESSAGE.IDEMPOTENCY_KEY_IS_REQUIRED,
      invalid: VALIDATION_ERROR_MESSAGE.IDEMPOTENCY_KEY_MUST_BE_A_STRING
    }),
    trim(),
    nonEmpty(VALIDATION_ERROR_MESSAGE.IDEMPOTENCY_KEY_IS_REQUIRED),
    maxLength(128, VALIDATION_ERROR_MESSAGE.IDEMPOTENCY_KEY_LENGTH_INVALID)
  )
});

export const PaymentIdParamsSchema = requestObject({
  paymentId: idSchema({
    required: VALIDATION_ERROR_MESSAGE.PAYMENT_ID_IS_REQUIRED,
    invalid: VALIDATION_ERROR_MESSAGE.PAYMENT_ID_MUST_BE_A_STRING,
    format: VALIDATION_ERROR_MESSAGE.INVALID_PAYMENT_ID
  })
});
