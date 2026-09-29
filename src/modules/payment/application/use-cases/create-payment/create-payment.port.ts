import { UseCase } from '@/modules/core/application/base.usecase';
import { PaymentProvider, PaymentSafeProps } from '@/modules/payment/domain/entities/payment.type';

export interface CreatePaymentProps {
  userId: string;
  provider: PaymentProvider;
  idempotencyKey: string;
  clientIp: string;
}

export class CreatePaymentCommand implements CreatePaymentProps {
  userId: string;
  provider: PaymentProvider;
  idempotencyKey: string;
  clientIp: string;

  constructor(payload: CreatePaymentProps) {
    this.userId = payload.userId;
    this.provider = payload.provider;
    this.idempotencyKey = payload.idempotencyKey;
    this.clientIp = payload.clientIp;
  }
}

export abstract class CreatePaymentPort implements UseCase<CreatePaymentCommand, PaymentSafeProps> {
  abstract execute(command: CreatePaymentCommand): Promise<PaymentSafeProps>;
}
