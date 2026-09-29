import { isValidId } from '@/modules/core/domain/helpers/ids';
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
