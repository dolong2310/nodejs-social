import { isValidId } from '@/modules/core/domain/helpers/ids';
import {
  MAX_PAYMENT_AMOUNT_VND,
  MAX_PAYMENT_DESCRIPTION_LENGTH,
  MAX_PAYMENT_SOURCE_REFERENCE_LENGTH,
  MIN_PAYMENT_AMOUNT_VND
} from '@/modules/payment/domain/entities/payment.type';
import { ExpressRequestHandler } from '@/presentation/http/express/types';
import { validate } from '@/presentation/http/express/utils/validation.util';
import { checkSchema } from 'express-validator';

export interface IPaymentPipe {
  createPaymentPipe: ExpressRequestHandler;
  idempotencyKeyHeader: ExpressRequestHandler;
  paymentIdParam: ExpressRequestHandler;
}

export class PaymentsPipe implements IPaymentPipe {
  createPaymentPipe = validate(
    checkSchema(
      {
        provider: {
          notEmpty: { errorMessage: 'Payment provider is required' },
          isIn: { options: [['vnpay', 'momo']], errorMessage: 'Payment provider must be vnpay or momo' }
        },
        sourceReference: {
          notEmpty: { errorMessage: 'Source reference is required' },
          isString: { errorMessage: 'Source reference must be a string' },
          trim: true,
          isLength: {
            options: { min: 1, max: MAX_PAYMENT_SOURCE_REFERENCE_LENGTH },
            errorMessage: `Source reference must contain between 1 and ${MAX_PAYMENT_SOURCE_REFERENCE_LENGTH} characters`
          }
        },
        description: {
          notEmpty: { errorMessage: 'Payment description is required' },
          isString: { errorMessage: 'Payment description must be a string' },
          trim: true,
          isLength: {
            options: { min: 1, max: MAX_PAYMENT_DESCRIPTION_LENGTH },
            errorMessage: `Payment description must contain between 1 and ${MAX_PAYMENT_DESCRIPTION_LENGTH} characters`
          }
        },
        amountVnd: {
          notEmpty: { errorMessage: 'Payment amount is required' },
          isInt: {
            options: { min: MIN_PAYMENT_AMOUNT_VND, max: MAX_PAYMENT_AMOUNT_VND },
            errorMessage: `Payment amount must be an integer between ${MIN_PAYMENT_AMOUNT_VND} and ${MAX_PAYMENT_AMOUNT_VND} VND`
          },
          toInt: true
        }
      },
      ['body']
    )
  );

  idempotencyKeyHeader = validate(
    checkSchema(
      {
        'idempotency-key': {
          notEmpty: { errorMessage: 'Idempotency-Key header is required' },
          isString: { errorMessage: 'Idempotency-Key must be a string' },
          trim: true,
          isLength: {
            options: { min: 1, max: 128 },
            errorMessage: 'Idempotency-Key must contain between 1 and 128 characters'
          }
        }
      },
      ['headers']
    )
  );

  paymentIdParam = validate(
    checkSchema(
      {
        paymentId: {
          notEmpty: { errorMessage: 'Payment ID is required' },
          isString: { errorMessage: 'Payment ID must be a string' },
          trim: true,
          custom: {
            options: (id: string) => isValidId(id),
            errorMessage: 'Invalid payment ID'
          }
        }
      },
      ['params']
    )
  );
}
