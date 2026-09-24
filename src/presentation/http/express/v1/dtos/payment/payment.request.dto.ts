import { PaymentProvider } from '@/modules/payment/domain/entities/payment.type';
import { ParamsDictionary } from 'express-serve-static-core';

export interface CreateExamplePaymentBodyDTO {
  provider: PaymentProvider;
}

export interface PaymentIdParams extends ParamsDictionary {
  paymentId: string;
}
