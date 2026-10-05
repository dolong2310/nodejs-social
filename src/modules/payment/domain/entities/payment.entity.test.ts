import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type {
  CreatePaymentProps,
  PaymentProvider,
  VerifiedNotification
} from '@/modules/payment/domain/entities/payment.types';
import { describe, expect, it } from 'vitest';

const validInput: CreatePaymentProps = {
  userId: 'u_user',
  provider: 'vnpay',
  providerOrderId: 'provider-order-1',
  expiresAt: null,
  sourceReference: 'order_client_1',
  description: 'Thanh toan don hang client 1',
  amountVnd: 150_000,
  idempotencyKey: 'key-1'
};

describe('PaymentEntity', () => {
  it('creates an order from the supplied payment details and the provider order reference', () => {
    const now = new Date('2026-10-01T18:30:00.000Z');
    const expiresAt = new Date(now.getTime() + 15 * 60 * 1000);
    const first = PaymentEntity.create({
      ...validInput,
      providerOrderId: 'provider-order-1',
      expiresAt,
      now
    }).toObject();
    const second = PaymentEntity.create({
      ...validInput,
      sourceReference: 'order_client_2',
      description: 'Thanh toan don hang client 2',
      amountVnd: 250_000,
      idempotencyKey: 'key-2',
      providerOrderId: 'provider-order-2'
    }).toObject();

    expect(first).toMatchObject({
      sourceReference: 'order_client_1',
      description: 'Thanh toan don hang client 1',
      amountVnd: 150_000,
      currency: 'VND',
      status: 'creating',
      userId: 'u_user',
      sourceType: 'order',
      provider: 'vnpay',
      providerOrderId: 'provider-order-1',
      expiresAt,
      createdAt: now
    });
    expect(first.id).toMatch(/^p_[0-9a-f-]{36}$/i);
    expect(first.providerRequestId).not.toBe(second.providerRequestId);
  });

  it('keeps a provider order without checkout expiry', () => {
    const payment = PaymentEntity.create({ ...validInput, provider: 'momo', expiresAt: null }).toObject();

    expect(payment.expiresAt).toBeNull();
  });

  it.each([
    { ...validInput, userId: '' },
    { ...validInput, idempotencyKey: ' ' },
    { ...validInput, provider: 'unknown' as PaymentProvider },
    { ...validInput, providerOrderId: ' ' },
    { ...validInput, expiresAt: new Date(Number.NaN) },
    { ...validInput, sourceReference: ' ' },
    { ...validInput, description: ' ' },
    { ...validInput, amountVnd: 9_999 }
  ])('rejects invalid creation input %#', (input) => {
    expect(() => PaymentEntity.create(input)).toThrow();
  });
});

function notificationFor(payment: PaymentEntity, overrides: Partial<VerifiedNotification> = {}): VerifiedNotification {
  const props = payment.getProps();
  return {
    provider: props.provider,
    providerOrderId: props.providerOrderId,
    providerRequestId: props.providerRequestId,
    amountVnd: props.amountVnd,
    providerTransactionId: 'txn-1',
    resultCode: '00',
    outcome: 'succeeded',
    ...overrides
  };
}

function succeededPayment(): PaymentEntity {
  const payment = PaymentEntity.create(validInput);
  payment.applyVerifiedOutcome(notificationFor(payment));
  return payment;
}

describe('PaymentEntity state transitions', () => {
  it('attaches the checkout URL and moves a creating payment to pending', () => {
    const payment = PaymentEntity.create(validInput);

    expect(payment.attachCheckoutUrl('https://sandbox.example/checkout')).toBe(true);
    expect(payment.getProps()).toMatchObject({ status: 'pending', checkoutUrl: 'https://sandbox.example/checkout' });
    expect(payment.attachCheckoutUrl('https://sandbox.example/other')).toBe(false);
    expect(payment.getProps().checkoutUrl).toBe('https://sandbox.example/checkout');
  });

  it('attaches the checkout URL without changing an early provider result', () => {
    const payment = succeededPayment();

    expect(payment.attachCheckoutUrl('https://sandbox.example/checkout')).toBe(true);
    expect(payment.getProps()).toMatchObject({ status: 'succeeded', checkoutUrl: 'https://sandbox.example/checkout' });
  });

  it('never attaches a checkout URL to a payment whose creation failed', () => {
    const payment = PaymentEntity.create(validInput);
    payment.markCreateFailed('MERCHANT_REJECTED');

    expect(payment.attachCheckoutUrl('https://sandbox.example/checkout')).toBe(false);
    expect(payment.getProps().checkoutUrl).toBeNull();
  });

  it('sets unknown and definitive creation failure only while creating', () => {
    const uncertain = PaymentEntity.create(validInput);
    expect(uncertain.markUnknown()).toBe(true);
    expect(uncertain.markCreateFailed('MERCHANT_REJECTED')).toBe(false);
    expect(uncertain.getProps().status).toBe('unknown');

    const rejected = PaymentEntity.create(validInput);
    expect(rejected.markCreateFailed('MERCHANT_REJECTED')).toBe(true);
    expect(rejected.getProps()).toMatchObject({ status: 'create_failed', providerResultCode: 'MERCHANT_REJECTED' });
    expect(rejected.markUnknown()).toBe(false);
  });

  it('applies a verified outcome and stores the provider result', () => {
    const payment = PaymentEntity.create(validInput);
    const createdUpdatedAt = payment.updatedAt;

    expect(payment.applyVerifiedOutcome(notificationFor(payment, { providerTransactionId: '0' }))).toBe('applied');
    expect(payment.getProps()).toMatchObject({
      status: 'succeeded',
      providerResultCode: '00',
      providerTransactionId: null
    });
    expect(payment.updatedAt.getTime()).toBeGreaterThanOrEqual(createdUpdatedAt.getTime());
  });

  it('rejects mismatched amount and request reference without changing the payment', () => {
    const payment = PaymentEntity.create(validInput);

    expect(payment.applyVerifiedOutcome(notificationFor(payment, { amountVnd: 1 }))).toBe('amount_mismatch');
    expect(payment.applyVerifiedOutcome(notificationFor(payment, { providerRequestId: 'other' }))).toBe(
      'reference_mismatch'
    );
    expect(payment.getProps().status).toBe('creating');
  });

  it('keeps a final result: a replay is duplicate and a different result is a state conflict', () => {
    const payment = succeededPayment();

    expect(payment.applyVerifiedOutcome(notificationFor(payment))).toBe('duplicate');
    expect(payment.applyVerifiedOutcome(notificationFor(payment, { outcome: 'pending', resultCode: '01' }))).toBe(
      'duplicate'
    );
    expect(payment.applyVerifiedOutcome(notificationFor(payment, { outcome: 'failed', resultCode: '05' }))).toBe(
      'state_conflict'
    );
    expect(payment.applyVerifiedOutcome(notificationFor(payment, { providerTransactionId: 'txn-2' }))).toBe(
      'state_conflict'
    );
    expect(payment.getProps()).toMatchObject({ status: 'succeeded', providerTransactionId: 'txn-1' });
  });

  it('rejects any provider result after a definitive creation failure', () => {
    const payment = PaymentEntity.create(validInput);
    payment.markCreateFailed('MERCHANT_REJECTED');

    expect(payment.applyVerifiedOutcome(notificationFor(payment))).toBe('state_conflict');
    expect(payment.getProps().status).toBe('create_failed');
  });

  it('moves a pending payment to a final result and treats a repeated pending result as duplicate', () => {
    const payment = PaymentEntity.create(validInput);
    const pending = notificationFor(payment, { outcome: 'pending', resultCode: '01', providerTransactionId: null });

    expect(payment.applyVerifiedOutcome(pending)).toBe('applied');
    expect(payment.applyVerifiedOutcome(pending)).toBe('duplicate');
    expect(payment.applyVerifiedOutcome(notificationFor(payment))).toBe('applied');
    expect(payment.getProps().status).toBe('succeeded');
  });

  it('leaves the payment unchanged when a transition would break an invariant', () => {
    const payment = PaymentEntity.create(validInput);
    const before = payment.toObject();

    expect(() =>
      payment.applyVerifiedOutcome(
        notificationFor(payment, { outcome: 'unexpected' as VerifiedNotification['outcome'] })
      )
    ).toThrow();
    expect(payment.toObject()).toEqual(before);
  });
});
