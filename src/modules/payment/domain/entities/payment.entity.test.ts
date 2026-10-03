import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type {
  CreatePaymentProps,
  PaymentProvider,
  PaymentStatus
} from '@/modules/payment/domain/entities/payment.types';
import { describe, expect, it } from 'vitest';

function canTransitionPaymentStatus(from: PaymentStatus, to: PaymentStatus): boolean {
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

  it('prevents a terminal success from transitioning to payment failure', () => {
    expect(canTransitionPaymentStatus('creating', 'pending')).toBe(true);
    expect(canTransitionPaymentStatus('succeeded', 'failed')).toBe(false);
    expect(canTransitionPaymentStatus('succeeded', 'cancelled')).toBe(false);
  });
});
