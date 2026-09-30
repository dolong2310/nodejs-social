import { createHash } from 'node:crypto';
import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import {
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  CreatePaymentProps,
  MAX_PAYMENT_AMOUNT_VND,
  MAX_PAYMENT_DESCRIPTION_LENGTH,
  MAX_PAYMENT_SOURCE_REFERENCE_LENGTH,
  MIN_PAYMENT_AMOUNT_VND,
  PaymentProps,
  PaymentStatus
} from '@/modules/payment/domain/entities/payment.type';

const VNPAY_CHECKOUT_TTL_MS = 15 * 60 * 1000;

type PaymentRequestFingerprintProps = Pick<
  CreatePaymentProps,
  'provider' | 'sourceReference' | 'description' | 'amountVnd'
>;

export function createPaymentRequestFingerprint(input: PaymentRequestFingerprintProps): string {
  const request = JSON.stringify({
    sourceType: 'order',
    provider: input.provider,
    sourceReference: input.sourceReference,
    description: input.description,
    amountVnd: input.amountVnd
  });
  return createHash('sha256').update(request).digest('hex');
}

export function canTransitionPaymentStatus(from: PaymentStatus, to: PaymentStatus): boolean {
  if (from === to) return true;
  if (from === 'succeeded' || from === 'failed' || from === 'cancelled' || from === 'create_failed') return false;

  if (from === 'creating')
    return to === 'pending' || to === 'unknown' || to === 'create_failed' || isProviderOutcome(to);
  if (from === 'pending') return isProviderOutcome(to);
  if (from === 'unknown') return to === 'pending' || isProviderOutcome(to);
  return false;
}

function isProviderOutcome(status: PaymentStatus): boolean {
  return status === 'pending' || status === 'succeeded' || status === 'failed' || status === 'cancelled';
}

export class PaymentEntity extends Entity<PaymentProps> {
  static create(input: CreatePaymentProps): PaymentEntity {
    const now = input.now ?? new Date();
    const entity = new PaymentEntity({
      id: new UniqueEntityID(generatePrefixId('p')),
      createdAt: now,
      updatedAt: now,
      props: {
        userId: input.userId,
        sourceType: 'order',
        sourceReference: input.sourceReference,
        description: input.description,
        amountVnd: input.amountVnd,
        currency: 'VND',
        provider: input.provider,
        providerOrderId: generatePrefixId('po'),
        providerRequestId: generatePrefixId('pr'),
        idempotencyKey: input.idempotencyKey,
        requestFingerprint: createPaymentRequestFingerprint(input),
        status: 'creating',
        checkoutUrl: null,
        expiresAt: input.provider === 'vnpay' ? new Date(now.getTime() + VNPAY_CHECKOUT_TTL_MS) : null,
        providerTransactionId: null,
        providerResultCode: null,
        version: 0
      }
    });
    return entity;
  }

  validate(): void {
    const payment = this.getProps();
    invariant(payment.userId.trim().length > 0, new ArgumentNotProvidedException('Payment user ID is required'));
    invariant(
      payment.idempotencyKey.trim().length > 0,
      new ArgumentNotProvidedException('Idempotency key is required')
    );
    invariant(
      payment.sourceReference.trim().length > 0 &&
        payment.sourceReference.trim().length <= MAX_PAYMENT_SOURCE_REFERENCE_LENGTH,
      new ArgumentInvalidException(
        `Source reference must contain between 1 and ${MAX_PAYMENT_SOURCE_REFERENCE_LENGTH} characters`
      )
    );
    invariant(
      payment.description.trim().length > 0 && payment.description.trim().length <= MAX_PAYMENT_DESCRIPTION_LENGTH,
      new ArgumentInvalidException(
        `Payment description must contain between 1 and ${MAX_PAYMENT_DESCRIPTION_LENGTH} characters`
      )
    );
    invariant(
      payment.providerOrderId.trim().length > 0,
      new ArgumentNotProvidedException('Provider order ID is required')
    );
    invariant(
      payment.providerRequestId.trim().length > 0,
      new ArgumentNotProvidedException('Provider request ID is required')
    );
    invariant(
      payment.requestFingerprint.length > 0,
      new ArgumentNotProvidedException('Request fingerprint is required')
    );
    invariant(
      Number.isInteger(payment.amountVnd) &&
        payment.amountVnd >= MIN_PAYMENT_AMOUNT_VND &&
        payment.amountVnd <= MAX_PAYMENT_AMOUNT_VND,
      new ArgumentInvalidException(
        `Payment amount must be an integer between ${MIN_PAYMENT_AMOUNT_VND} and ${MAX_PAYMENT_AMOUNT_VND} VND`
      )
    );
    invariant(payment.currency === 'VND', new ArgumentInvalidException('Payment currency must be VND'));
    invariant(payment.sourceType === 'order', new ArgumentInvalidException('Unsupported payment source type'));
    invariant(
      PAYMENT_PROVIDERS.includes(payment.provider),
      new ArgumentInvalidException('Unsupported payment provider')
    );
    invariant(PAYMENT_STATUSES.includes(payment.status), new ArgumentInvalidException('Invalid payment status'));
    invariant(
      payment.provider !== 'vnpay' || payment.expiresAt instanceof Date,
      new ArgumentNotProvidedException('VNPay expiry is required')
    );
    invariant(
      payment.expiresAt === null || !Number.isNaN(payment.expiresAt.getTime()),
      new ArgumentInvalidException('Invalid payment expiry')
    );
  }
}
