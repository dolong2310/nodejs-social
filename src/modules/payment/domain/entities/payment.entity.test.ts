import { describe, expect, it } from 'vitest';
import { PaymentEntity, canTransitionPaymentStatus } from '@/modules/payment/domain/entities/payment.entity';
import { PaymentProvider } from '@/modules/payment/domain/entities/payment.type';

describe('PaymentEntity', () => {
  it('creates a server-priced VNPay example with a future expiry and unique references', () => {
    const first = PaymentEntity.createExample({ userId: 'u_user', provider: 'vnpay', idempotencyKey: 'key-1' }).toObject();
    const second = PaymentEntity.createExample({ userId: 'u_user', provider: 'vnpay', idempotencyKey: 'key-2' }).toObject();

    expect(first).toMatchObject({ amountVnd: 10_000, currency: 'VND', status: 'creating', userId: 'u_user' });
    expect(first.id).toMatch(/^p_[0-9a-f-]{36}$/i);
    expect(first.sourceReference).not.toBe(second.sourceReference);
    expect(first.providerOrderId).not.toBe(second.providerOrderId);
    expect(first.providerRequestId).not.toBe(second.providerRequestId);
    expect(first.expiresAt).toBeInstanceOf(Date);
    expect(first.expiresAt!.getTime()).toBeGreaterThan(Date.now());
  });

  it('creates a MoMo example without inventing a provider expiry', () => {
    const payment = PaymentEntity.createExample({ userId: 'u_user', provider: 'momo', idempotencyKey: 'key-1' }).toObject();

    expect(payment.expiresAt).toBeNull();
  });

  it.each([
    { userId: '', provider: 'vnpay' as PaymentProvider, idempotencyKey: 'key-1' },
    { userId: 'u_user', provider: 'vnpay' as PaymentProvider, idempotencyKey: ' ' },
    { userId: 'u_user', provider: 'unknown' as PaymentProvider, idempotencyKey: 'key-1' }
  ])('rejects invalid creation input %#', (input) => {
    expect(() => PaymentEntity.createExample(input)).toThrow();
  });

  it('prevents a terminal success from transitioning to payment failure', () => {
    expect(canTransitionPaymentStatus('creating', 'pending')).toBe(true);
    expect(canTransitionPaymentStatus('succeeded', 'failed')).toBe(false);
    expect(canTransitionPaymentStatus('succeeded', 'cancelled')).toBe(false);
  });
});
