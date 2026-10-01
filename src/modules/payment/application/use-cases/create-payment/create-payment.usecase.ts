import { ConflictException } from '@/modules/core/domain/exceptions/exceptions';
import {
  PaymentCheckoutError,
  type PaymentGatewayPort
} from '@/modules/payment/application/ports/payment-gateway.port';
import {
  type CreatePaymentInputPort,
  CreatePaymentPort
} from '@/modules/payment/application/use-cases/create-payment/create-payment.port';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type {
  PaymentFullProps,
  PaymentProvider,
  PaymentSafeProps
} from '@/modules/payment/domain/entities/payment.types';
import type { PaymentRepositoryPort } from '@/modules/payment/domain/repositories/payment.repository';

export class CreatePaymentUseCase extends CreatePaymentPort {
  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly gateways: Record<PaymentProvider, PaymentGatewayPort>
  ) {
    super();
  }

  async execute(input: CreatePaymentInputPort): Promise<PaymentSafeProps> {
    const candidate = PaymentEntity.create({
      userId: input.userId,
      provider: input.provider,
      sourceReference: input.sourceReference,
      description: input.description,
      amountVnd: input.amountVnd,
      idempotencyKey: input.idempotencyKey
    });

    const result = await this.paymentRepository.insertOrFindByIdempotency(candidate);
    if (!result.inserted) {
      if (result.payment.getProps().requestFingerprint !== candidate.getProps().requestFingerprint) {
        throw new ConflictException('Idempotency key was already used for a different payment request');
      }
      return this.toSafeProps(result.payment);
    }

    let checkoutUrl: string;
    try {
      checkoutUrl = await this.gateways[input.provider].createCheckout(
        result.payment.toObject<PaymentFullProps>(),
        input.clientIp
      );
    } catch (error) {
      if (error instanceof PaymentCheckoutError && error.classification.kind === 'definitive_rejection') {
        return this.toSafeProps(
          await this.paymentRepository.setCreateFailedIfCreating(
            result.payment.id.toString(),
            error.classification.resultCode
          )
        );
      }
      return this.toSafeProps(await this.paymentRepository.setUnknownIfCreating(result.payment.id.toString()));
    }
    return this.toSafeProps(
      await this.paymentRepository.attachCheckoutUrlIfAbsent(result.payment.id.toString(), checkoutUrl)
    );
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
