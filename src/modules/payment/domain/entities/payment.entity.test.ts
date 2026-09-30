import { describe, expect, it } from 'vitest';
import { PaymentEntity, canTransitionPaymentStatus } from '@/modules/payment/domain/entities/payment.entity';
import { PaymentProvider } from '@/modules/payment/domain/entities/payment.type';

describe('PaymentEntity', () => {
  it('creates a VNPay order from the supplied payment details with a future expiry', () => {
    const first = PaymentEntity.create({
      userId: 'u_user',
      provider: 'vnpay',
      sourceReference: 'order_client_1',
      description: 'Thanh toan don hang client 1',
      amountVnd: 150_000,
      idempotencyKey: 'key-1'
    }).toObject();
    const second = PaymentEntity.create({
      userId: 'u_user',
      provider: 'vnpay',
      sourceReference: 'order_client_2',
      description: 'Thanh toan don hang client 2',
      amountVnd: 250_000,
      idempotencyKey: 'key-2'
    }).toObject();

    expect(first).toMatchObject({
      sourceReference: 'order_client_1',
      description: 'Thanh toan don hang client 1',
      amountVnd: 150_000,
      currency: 'VND',
      status: 'creating',
      userId: 'u_user',
      sourceType: 'order'
    });
    expect(first.id).toMatch(/^p_[0-9a-f-]{36}$/i);
    expect(first.sourceReference).not.toBe(second.sourceReference);
    expect(first.providerOrderId).not.toBe(second.providerOrderId);
    expect(first.providerRequestId).not.toBe(second.providerRequestId);
    expect(first.expiresAt).toBeInstanceOf(Date);
    expect(first.expiresAt!.getTime()).toBeGreaterThan(Date.now());
  });

  it('creates a MoMo order without inventing a provider expiry', () => {
    const payment = PaymentEntity.create({
      userId: 'u_user',
      provider: 'momo',
      sourceReference: 'order_client_1',
      description: 'Thanh toan don hang client 1',
      amountVnd: 150_000,
      idempotencyKey: 'key-1'
    }).toObject();

    expect(payment.expiresAt).toBeNull();
  });

  it.each([
    {
      userId: '',
      provider: 'vnpay' as PaymentProvider,
      sourceReference: 'order_client_1',
      description: 'Order client 1',
      amountVnd: 10_000,
      idempotencyKey: 'key-1'
    },
    {
      userId: 'u_user',
      provider: 'vnpay' as PaymentProvider,
      sourceReference: 'order_client_1',
      description: 'Order client 1',
      amountVnd: 10_000,
      idempotencyKey: ' '
    },
    {
      userId: 'u_user',
      provider: 'unknown' as PaymentProvider,
      sourceReference: 'order_client_1',
      description: 'Order client 1',
      amountVnd: 10_000,
      idempotencyKey: 'key-1'
    },
    {
      userId: 'u_user',
      provider: 'vnpay' as PaymentProvider,
      sourceReference: ' ',
      description: 'Order client 1',
      amountVnd: 10_000,
      idempotencyKey: 'key-1'
    },
    {
      userId: 'u_user',
      provider: 'vnpay' as PaymentProvider,
      sourceReference: 'order_client_1',
      description: ' ',
      amountVnd: 10_000,
      idempotencyKey: 'key-1'
    },
    {
      userId: 'u_user',
      provider: 'vnpay' as PaymentProvider,
      sourceReference: 'order_client_1',
      description: 'Order client 1',
      amountVnd: 9_999,
      idempotencyKey: 'key-1'
    }
  ])('rejects invalid creation input %#', (input) => {
    expect(() => PaymentEntity.create(input)).toThrow();
  });

  it('prevents a terminal success from transitioning to payment failure', () => {
    expect(canTransitionPaymentStatus('creating', 'pending')).toBe(true);
    expect(canTransitionPaymentStatus('succeeded', 'failed')).toBe(false);
    expect(canTransitionPaymentStatus('succeeded', 'cancelled')).toBe(false);
  });
});
