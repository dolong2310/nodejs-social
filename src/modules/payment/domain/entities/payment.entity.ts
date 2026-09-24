import { createHash } from 'node:crypto';
import { Entity } from '@/modules/core/domain/entities/base.entity';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ArgumentInvalidException, ArgumentNotProvidedException } from '@/modules/core/domain/exceptions/exceptions';
import { generatePrefixId } from '@/modules/core/domain/helpers/ids';
import { invariant } from '@/modules/core/domain/helpers/invariant';
import { PaymentProvider, PaymentRecord, PaymentStatus } from '@/modules/payment/domain/entities/payment.type';

const EXAMPLE_AMOUNT_VND = 10_000;
const VNPAY_CHECKOUT_TTL_MS = 15 * 60 * 1000;

type PaymentEntityProps = Omit<PaymentRecord, 'id' | 'createdAt' | 'updatedAt'>;

interface CreateExamplePaymentInput {
  userId: string;
  provider: PaymentProvider;
  idempotencyKey: string;
  now?: Date;
}

export function createPaymentRequestFingerprint(provider: PaymentProvider): string {
  const request = JSON.stringify({ sourceType: 'example', provider, amountVnd: EXAMPLE_AMOUNT_VND });
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

export class PaymentEntity extends Entity<PaymentEntityProps> {
  static createExample(input: CreateExamplePaymentInput): PaymentEntity {
    const now = input.now ?? new Date();
    const entity = new PaymentEntity({
      id: new UniqueEntityID(generatePrefixId('p')),
      createdAt: now,
      updatedAt: now,
      props: {
        userId: input.userId,
        sourceType: 'example',
        sourceReference: generatePrefixId('example'),
        description: 'Example order',
        amountVnd: EXAMPLE_AMOUNT_VND,
        currency: 'VND',
        provider: input.provider,
        providerOrderId: generatePrefixId('po'),
        providerRequestId: generatePrefixId('pr'),
        idempotencyKey: input.idempotencyKey,
        requestFingerprint: createPaymentRequestFingerprint(input.provider),
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
      payment.sourceReference.trim().length > 0,
      new ArgumentNotProvidedException('Source reference is required')
    );
    invariant(
      payment.description.trim().length > 0,
      new ArgumentNotProvidedException('Payment description is required')
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
      Number.isInteger(payment.amountVnd) && payment.amountVnd > 0,
      new ArgumentInvalidException('Payment amount must be a positive integer')
    );
    invariant(payment.currency === 'VND', new ArgumentInvalidException('Payment currency must be VND'));
    invariant(payment.sourceType === 'example', new ArgumentInvalidException('Unsupported payment source type'));
    invariant(
      ['vnpay', 'momo'].includes(payment.provider),
      new ArgumentInvalidException('Unsupported payment provider')
    );
    invariant(
      ['creating', 'pending', 'unknown', 'create_failed', 'succeeded', 'failed', 'cancelled'].includes(payment.status),
      new ArgumentInvalidException('Invalid payment status')
    );
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
