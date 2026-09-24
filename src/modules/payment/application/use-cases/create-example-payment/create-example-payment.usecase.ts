import { ConflictException } from '@/modules/core/domain/exceptions/exceptions';
import { PaymentCheckoutError, PaymentGatewayPort } from '@/modules/payment/application/ports/payment-gateway.port';
import {
  CreateExamplePaymentCommand,
  CreateExamplePaymentPort
} from '@/modules/payment/application/use-cases/create-example-payment/create-example-payment.port';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import { PaymentProvider, PaymentRecord } from '@/modules/payment/domain/entities/payment.type';
import { PaymentRepositoryPort } from '@/modules/payment/domain/repositories/payment.repository';

export class CreateExamplePaymentUseCase extends CreateExamplePaymentPort {
  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly gateways: Record<PaymentProvider, PaymentGatewayPort>
  ) {
    super();
  }

  async execute(command: CreateExamplePaymentCommand): Promise<PaymentRecord> {
    const candidate = PaymentEntity.createExample({
      userId: command.userId,
      provider: command.provider,
      idempotencyKey: command.idempotencyKey
    }).toObject<PaymentRecord>() as PaymentRecord;

    const result = await this.paymentRepository.insertOrFindByIdempotency(candidate);
    if (!result.inserted) {
      if (result.record.requestFingerprint !== candidate.requestFingerprint) {
        throw new ConflictException('Idempotency key was already used for a different payment request');
      }
      return result.record;
    }

    let checkoutUrl: string;
    try {
      checkoutUrl = await this.gateways[command.provider].createCheckout(result.record, command.clientIp);
    } catch (error) {
      if (error instanceof PaymentCheckoutError && error.classification.kind === 'definitive_rejection') {
        return this.paymentRepository.setCreateFailedIfCreating(result.record.id, error.classification.resultCode);
      }
      return this.paymentRepository.setUnknownIfCreating(result.record.id);
    }
    return this.paymentRepository.attachCheckoutUrlIfAbsent(result.record.id, checkoutUrl);
  }
}
