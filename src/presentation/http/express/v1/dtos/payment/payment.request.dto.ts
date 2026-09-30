import { PaymentProvider } from '@/modules/payment/domain/entities/payment.type';
import { ParamsDictionary } from 'express-serve-static-core';

export interface CreatePaymentBodyDTO {
  provider: PaymentProvider;
  sourceReference: string;
  description: string;
  amountVnd: number;
}

export interface PaymentIdParamsDTO extends ParamsDictionary {
  paymentId: string;
}
