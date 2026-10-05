import { ArgumentInvalidException, ConflictException } from '@/modules/core/domain/exceptions/exceptions';
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

// A version conflict means another write (e.g. an early provider callback) landed between load and save.
const MAX_SAVE_ATTEMPTS = 3;

export class CreatePaymentUseCase extends CreatePaymentPort {
  constructor(
    private readonly paymentRepository: PaymentRepositoryPort,
    private readonly gateways: Record<PaymentProvider, PaymentGatewayPort>
  ) {
    super();
  }

  async execute(input: CreatePaymentInputPort): Promise<PaymentSafeProps> {
    const gateway = this.gateways[input.provider];
    if (!gateway) throw new ArgumentInvalidException('Unsupported payment provider');

    const now = new Date();
    const reference = gateway.createOrderReference(now);
    const entity = PaymentEntity.create({
      userId: input.userId,
      provider: input.provider,
      providerOrderId: reference.providerOrderId,
      expiresAt: reference.expiresAt,
      sourceReference: input.sourceReference,
      description: input.description,
      amountVnd: input.amountVnd,
      idempotencyKey: input.idempotencyKey,
      now
    });

    const result = await this.paymentRepository.insertOrFindByIdempotency(entity);
    if (!result.inserted) {
      if (result.payment.getProps().requestFingerprint !== entity.getProps().requestFingerprint) {
        throw new ConflictException('Idempotency key was already used for a different payment request');
      }
      return this.toSafeProps(result.payment);
    }

    let checkoutUrl: string;
    try {
      checkoutUrl = await gateway.createCheckout(result.payment.toObject<PaymentFullProps>(), input.clientIp);
    } catch (error) {
      if (error instanceof PaymentCheckoutError && error.classification.kind === 'definitive_rejection') {
        const { resultCode } = error.classification;
        return this.toSafeProps(
          await this.changeAndSave(result.payment, (payment) => payment.markCreateFailed(resultCode))
        );
      }
      return this.toSafeProps(await this.changeAndSave(result.payment, (payment) => payment.markUnknown()));
    }
    return this.toSafeProps(
      await this.changeAndSave(result.payment, (payment) => payment.attachCheckoutUrl(checkoutUrl))
    );
  }

  /**
   * Applies a domain change and saves it. On a version conflict the change is re-applied to the latest state,
   * where the entity may decide it no longer applies (e.g. the provider already reported the result).
   */
  private async changeAndSave(
    payment: PaymentEntity,
    change: (payment: PaymentEntity) => boolean
  ): Promise<PaymentEntity> {
    let current = payment;
    for (let attempt = 0; attempt < MAX_SAVE_ATTEMPTS; attempt++) {
      if (!change(current)) return current;
      const saved = await this.paymentRepository.save(current);
      if (saved) return saved;

      const latest = await this.paymentRepository.findPaymentById(payment.id.toString());
      if (!latest) throw new Error(`Payment ${payment.id.toString()} was not found`);
      current = latest;
    }
    throw new ConflictException('Payment was changed concurrently, please retry');
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
