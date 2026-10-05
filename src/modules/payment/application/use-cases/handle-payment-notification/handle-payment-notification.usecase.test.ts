import { describe, expect, it, vi } from 'vitest';
import {
  PaymentNotificationVerificationError,
  type PaymentNotificationVerificationReason
} from '@/modules/payment/application/exceptions/payment-notification.exception';
import type { PaymentGatewayPort } from '@/modules/payment/application/ports/payment-gateway.port';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type { PaymentFullProps, VerifiedNotification } from '@/modules/payment/domain/entities/payment.types';
import { HandlePaymentNotificationUseCase } from '@/modules/payment/application/use-cases/handle-payment-notification/handle-payment-notification.usecase';
import { InMemoryPaymentRepository } from '@test/support/doubles/payment-repository.double';

class FakePaymentGateway implements PaymentGatewayPort {
  createOrderReference = vi.fn(() => ({ providerOrderId: 'order-1', expiresAt: null }));
  createCheckout = vi.fn(async () => 'https://sandbox.example/checkout');
  verifyNotification = vi.fn((payload: unknown) => payload as VerifiedNotification);
}

function storedPayment(providerOrderId = 'order-1'): PaymentFullProps {
  return PaymentEntity.create({
    userId: 'u_notification_test',
    provider: 'vnpay',
    providerOrderId,
    expiresAt: null,
    sourceReference: `order_${providerOrderId}`,
    description: 'Notification test order',
    amountVnd: 10_000,
    idempotencyKey: `key-${providerOrderId}`
  }).toObject<PaymentFullProps>();
}

function setup() {
  const vnpay = new FakePaymentGateway();
  const momo = new FakePaymentGateway();
  const zalopay = new FakePaymentGateway();
  const repository = new InMemoryPaymentRepository();
  const payment = storedPayment();
  repository.addRecord(payment);
  const useCase = new HandlePaymentNotificationUseCase(repository, { vnpay, momo, zalopay });

  const notification = (overrides: Partial<VerifiedNotification> = {}): VerifiedNotification => ({
    provider: 'vnpay',
    providerOrderId: payment.providerOrderId,
    providerRequestId: payment.providerRequestId,
    amountVnd: payment.amountVnd,
    providerTransactionId: 'transaction-1',
    resultCode: '00',
    outcome: 'succeeded',
    ...overrides
  });
  const receive = (verified: VerifiedNotification) => {
    vnpay.verifyNotification.mockReturnValueOnce(verified);
    return useCase.execute({ provider: 'vnpay', payload: { signed: true } });
  };

  return { repository, payment, vnpay, momo, useCase, notification, receive };
}

describe('HandlePaymentNotificationUseCase', () => {
  it.each(['succeeded', 'failed', 'pending', 'cancelled'] as const)(
    'stores a verified %s notification on a creating payment',
    async (outcome) => {
      const { repository, payment, vnpay, momo, notification, receive } = setup();

      await expect(receive(notification({ outcome }))).resolves.toBe('applied');

      expect(vnpay.verifyNotification).toHaveBeenCalledWith({ signed: true });
      expect(momo.verifyNotification).not.toHaveBeenCalled();
      expect(repository.statusOf(payment.id)).toBe(outcome);
    }
  );

  it('classifies a replayed notification as duplicate', async () => {
    const { notification, receive } = setup();

    await expect(receive(notification())).resolves.toBe('applied');
    await expect(receive(notification())).resolves.toBe('duplicate');
  });

  it('distinguishes missing orders, amount mismatch, and request reference mismatch without writing', async () => {
    const { repository, payment, notification, receive } = setup();

    await expect(receive(notification({ providerOrderId: 'missing' }))).resolves.toBe('not_found');
    await expect(receive(notification({ amountVnd: 1 }))).resolves.toBe('amount_mismatch');
    await expect(receive(notification({ providerRequestId: 'wrong-request' }))).resolves.toBe('reference_mismatch');
    expect(repository.statusOf(payment.id)).toBe('creating');
  });

  it('rejects a failure after success without reversing the result', async () => {
    const { repository, payment, notification, receive } = setup();
    await receive(notification());

    await expect(receive(notification({ outcome: 'failed', resultCode: '05' }))).resolves.toBe('state_conflict');
    expect(repository.statusOf(payment.id)).toBe('succeeded');
  });

  it('handles concurrent identical callbacks as applied and duplicate', async () => {
    const { repository, payment, notification, receive } = setup();

    const results = await Promise.all([receive(notification()), receive(notification())]);

    expect(results.sort()).toEqual(['applied', 'duplicate']);
    expect(repository.statusOf(payment.id)).toBe('succeeded');
  });

  it('re-applies the notification on the latest state after a concurrent write', async () => {
    const { repository, payment, notification, receive } = setup();
    // Another request saves first, so the first save attempt carries a stale version.
    const save = repository.save.bind(repository);
    let interfered = false;
    vi.spyOn(repository, 'save').mockImplementation(async (entity) => {
      if (!interfered) {
        interfered = true;
        const latest = await repository.findPaymentById(payment.id);
        latest!.attachCheckoutUrl('https://sandbox.example/checkout');
        await save(latest!);
      }
      return save(entity);
    });

    await expect(receive(notification())).resolves.toBe('applied');
    expect(repository.records.get(payment.id)).toMatchObject({
      status: 'succeeded',
      checkoutUrl: 'https://sandbox.example/checkout'
    });
  });

  it('reports a provider transaction ID already used by another order as a state conflict', async () => {
    const { repository, payment, notification, receive } = setup();
    const other = storedPayment('order-2');
    repository.addRecord(other);
    await receive(notification({ providerOrderId: other.providerOrderId, providerRequestId: other.providerRequestId }));

    await expect(receive(notification())).resolves.toBe('state_conflict');
    expect(repository.statusOf(payment.id)).toBe('creating');
  });

  it.each<PaymentNotificationVerificationReason>(['invalid_signature', 'merchant_mismatch'])(
    'propagates a typed %s verification error without touching storage',
    async (reason) => {
      const { repository, vnpay, useCase } = setup();
      const findSpy = vi.spyOn(repository, 'findPaymentByProviderOrderId');
      const error = new PaymentNotificationVerificationError(reason);
      vnpay.verifyNotification.mockImplementation(() => {
        throw error;
      });

      await expect(useCase.execute({ provider: 'vnpay', payload: { invalid: true } })).rejects.toBe(error);
      expect(findSpy).not.toHaveBeenCalled();
    }
  );

  it('rejects malformed normalized references before persistence', async () => {
    const { repository, notification, receive } = setup();
    const findSpy = vi.spyOn(repository, 'findPaymentByProviderOrderId');

    await expect(receive(notification({ providerOrderId: ' ' }))).rejects.toMatchObject({
      name: 'PaymentNotificationVerificationError',
      reason: 'invalid_payload'
    });
    expect(findSpy).not.toHaveBeenCalled();
  });

  it('propagates storage failures so the provider callback cannot be acknowledged as stored', async () => {
    const { repository, notification, receive } = setup();
    repository.failStorage = true;

    await expect(receive(notification())).rejects.toThrow('database unavailable');
  });
});
