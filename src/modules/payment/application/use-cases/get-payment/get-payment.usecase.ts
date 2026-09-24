import { NotFoundException } from '@/modules/core/domain/exceptions/exceptions';
import {
  GetPaymentCommand,
  GetPaymentPort
} from '@/modules/payment/application/use-cases/get-payment/get-payment.port';
import { PaymentRecord } from '@/modules/payment/domain/entities/payment.type';
import { PaymentRepositoryPort } from '@/modules/payment/domain/repositories/payment.repository';

export class GetPaymentUseCase extends GetPaymentPort {
  constructor(private readonly paymentRepository: PaymentRepositoryPort) {
    super();
  }

  async execute({ userId, paymentId }: GetPaymentCommand): Promise<PaymentRecord> {
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment || payment.userId !== userId) throw new NotFoundException('Payment not found');
    return payment;
  }
}
