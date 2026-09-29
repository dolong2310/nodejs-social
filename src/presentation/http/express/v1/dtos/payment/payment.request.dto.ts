import { PaymentProvider } from '@/modules/payment/domain/entities/payment.type';
import { ParamsDictionary } from 'express-serve-static-core';

export interface CreatePaymentBodyDTO {
  provider: PaymentProvider;
}

export interface PaymentIdParamsDTO extends ParamsDictionary {
  paymentId: string;
}
