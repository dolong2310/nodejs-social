import type { UseCase } from '@/modules/core/application/base.usecase';
import type { PaymentSafeProps } from '@/modules/payment/domain/entities/payment.types';

export interface GetPaymentProps {
  userId: string;
  paymentId: string;
}

export class GetPaymentInputPort implements GetPaymentProps {
  userId: string;
  paymentId: string;

  constructor(payload: GetPaymentProps) {
    this.userId = payload.userId;
    this.paymentId = payload.paymentId;
  }
}

export abstract class GetPaymentPort implements UseCase<GetPaymentInputPort, PaymentSafeProps> {
  abstract execute(input: GetPaymentInputPort): Promise<PaymentSafeProps>;
}
