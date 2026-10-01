import { UseCase } from '@/modules/core/application/base.usecase';
import { PaymentProvider, PaymentSafeProps } from '@/modules/payment/domain/entities/payment.types';

export interface CreatePaymentProps {
  userId: string;
  provider: PaymentProvider;
  sourceReference: string;
  description: string;
  amountVnd: number;
  idempotencyKey: string;
  clientIp: string;
}

export class CreatePaymentInputPort implements CreatePaymentProps {
  userId: string;
  provider: PaymentProvider;
  sourceReference: string;
  description: string;
  amountVnd: number;
  idempotencyKey: string;
  clientIp: string;

  constructor(payload: CreatePaymentProps) {
    this.userId = payload.userId;
    this.provider = payload.provider;
    this.sourceReference = payload.sourceReference;
    this.description = payload.description;
    this.amountVnd = payload.amountVnd;
    this.idempotencyKey = payload.idempotencyKey;
    this.clientIp = payload.clientIp;
  }
}

export abstract class CreatePaymentPort implements UseCase<CreatePaymentInputPort, PaymentSafeProps> {
  abstract execute(input: CreatePaymentInputPort): Promise<PaymentSafeProps>;
}
