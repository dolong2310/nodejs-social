import { UseCase } from '@/modules/core/application/base.usecase';
import { PaymentSafeProps } from '@/modules/payment/domain/entities/payment.type';

export interface GetPaymentProps {
  userId: string;
  paymentId: string;
}

export class GetPaymentCommand implements GetPaymentProps {
  userId: string;
  paymentId: string;

  constructor(payload: GetPaymentProps) {
    this.userId = payload.userId;
    this.paymentId = payload.paymentId;
  }
}

export abstract class GetPaymentPort implements UseCase<GetPaymentCommand, PaymentSafeProps> {
  abstract execute(command: GetPaymentCommand): Promise<PaymentSafeProps>;
}
