import { NotFoundException } from '@/modules/core/domain/exceptions/exceptions';
import {
  GetPaymentInputPort,
  GetPaymentPort
} from '@/modules/payment/application/use-cases/get-payment/get-payment.port';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import { PaymentFullProps, PaymentSafeProps } from '@/modules/payment/domain/entities/payment.types';
import { PaymentRepositoryPort } from '@/modules/payment/domain/repositories/payment.repository';

export class GetPaymentUseCase extends GetPaymentPort {
  constructor(private readonly paymentRepository: PaymentRepositoryPort) {
    super();
  }

  async execute(input: GetPaymentInputPort): Promise<PaymentSafeProps> {
    const { userId, paymentId } = input;
    const payment = await this.paymentRepository.findPaymentById(paymentId);
    if (!payment || payment.getProps().userId !== userId) throw new NotFoundException('Payment not found');
    return this.toSafeProps(payment);
  }

  private toSafeProps(payment: PaymentEntity): PaymentSafeProps {
    const props = payment.toObject<PaymentFullProps>();
    return {
      id: props.id,
      sourceReference: props.sourceReference,
      description: props.description,
      amountVnd: props.amountVnd,
      currency: props.currency,
      provider: props.provider,
      status: props.status,
      checkoutUrl: props.checkoutUrl,
      expiresAt: props.expiresAt,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt
    };
  }
}
