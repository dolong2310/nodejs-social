import type { PaymentProvider } from '@/modules/payment/domain/entities/payment.types';
import type { ParamsDictionary } from 'express-serve-static-core';

export interface CreatePaymentBodyDTO {
  provider: PaymentProvider;
  sourceReference: string;
  description: string;
  amountVnd: number;
}

export interface PaymentIdParamsDTO extends ParamsDictionary {
  paymentId: string;
}
