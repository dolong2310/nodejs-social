import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import {
  classifyExistingPaymentNotification,
  normalizeProviderTransactionId,
  URL_ATTACHABLE_PAYMENT_STATUSES
} from '@/modules/payment/domain/helpers/payment.policy';
import {
  type CreatePaymentProps,
  MAX_PAYMENT_AMOUNT_VND,
  MAX_PAYMENT_DESCRIPTION_LENGTH,
  MAX_PAYMENT_SOURCE_REFERENCE_LENGTH,
  MIN_PAYMENT_AMOUNT_VND,
  PAYMENT_PROVIDERS,
  PAYMENT_STATUSES,
  type PaymentOutcomeResult,
  type PaymentProps,
  type VerifiedNotification
} from '@/modules/payment/domain/entities/payment.types';
import { createHash } from 'node:crypto';

type PaymentRequestFingerprintProps = Pick<
  CreatePaymentProps,
  'provider' | 'sourceReference' | 'description' | 'amountVnd'
>;

function createPaymentRequestFingerprint(input: PaymentRequestFingerprintProps): string {
  const request = JSON.stringify({
    sourceType: 'order',
    provider: input.provider,
    sourceReference: input.sourceReference,
    description: input.description,
    amountVnd: input.amountVnd
  });
  return createHash('sha256').update(request).digest('hex');
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
        providerOrderId: input.providerOrderId,
        providerRequestId: generatePrefixId('pr'),
        idempotencyKey: input.idempotencyKey,
        requestFingerprint: createPaymentRequestFingerprint(input),
        status: 'creating',
        checkoutUrl: null,
        expiresAt: input.expiresAt,
        providerTransactionId: null,
        providerResultCode: null,
        version: 0
      }
    });
    return entity;
  }

  /**
   * Stores the checkout URL returned by the provider. A creating payment becomes pending; a payment the provider
   * already resolved (an early callback) keeps its status. Returns false when nothing changed.
   */
  attachCheckoutUrl(url: string): boolean {
    const { status, checkoutUrl } = this.getProps();
    if (checkoutUrl !== null || !URL_ATTACHABLE_PAYMENT_STATUSES.includes(status)) return false;
    this.updateProps({ checkoutUrl: url, status: status === 'creating' ? 'pending' : status });
    return true;
  }

  /** Checkout creation ended without a definitive answer. Only applies while creating. */
  markUnknown(): boolean {
    if (this.getProps().status !== 'creating') return false;
    this.updateProps({ status: 'unknown' });
    return true;
  }

  /** The provider definitively rejected checkout creation. Only applies while creating. */
  markCreateFailed(resultCode: string): boolean {
    if (this.getProps().status !== 'creating') return false;
    this.updateProps({ status: 'create_failed', providerResultCode: resultCode });
    return true;
  }

  /**
   * Applies a verified provider notification. Only 'applied' changes the payment; every other result explains why
   * it was rejected or ignored (a replay of the stored result is a 'duplicate').
   */
  applyVerifiedOutcome(notification: VerifiedNotification): PaymentOutcomeResult {
    const current = this.getProps();
    if (current.amountVnd !== notification.amountVnd) return 'amount_mismatch';
    if (notification.providerRequestId !== undefined && current.providerRequestId !== notification.providerRequestId) {
      return 'reference_mismatch';
    }

    const existingResult = classifyExistingPaymentNotification(current, notification);
    if (existingResult) return existingResult;

    this.updateProps({
      status: notification.outcome,
      providerTransactionId: normalizeProviderTransactionId(notification.providerTransactionId),
      providerResultCode: notification.resultCode
    });
    return 'applied';
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
      payment.expiresAt === null || !Number.isNaN(payment.expiresAt.getTime()),
      new ArgumentInvalidException('Invalid payment expiry')
    );
  }
}
