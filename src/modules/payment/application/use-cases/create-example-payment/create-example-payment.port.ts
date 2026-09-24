import { UseCase } from '@/modules/core/application/base.usecase';
import { PaymentProvider, PaymentRecord } from '@/modules/payment/domain/entities/payment.type';

export interface CreateExamplePaymentProps {
  userId: string;
  provider: PaymentProvider;
  idempotencyKey: string;
  clientIp: string;
}

export class CreateExamplePaymentCommand implements CreateExamplePaymentProps {
  userId: string;
  provider: PaymentProvider;
  idempotencyKey: string;
  clientIp: string;

  constructor(payload: CreateExamplePaymentProps) {
    this.userId = payload.userId;
    this.provider = payload.provider;
    this.idempotencyKey = payload.idempotencyKey;
    this.clientIp = payload.clientIp;
  }
}

export abstract class CreateExamplePaymentPort implements UseCase<CreateExamplePaymentCommand, PaymentRecord> {
  abstract execute(command: CreateExamplePaymentCommand): Promise<PaymentRecord>;
}
