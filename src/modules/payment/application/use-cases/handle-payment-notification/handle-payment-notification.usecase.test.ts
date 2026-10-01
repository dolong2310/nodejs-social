import { describe, expect, it, vi } from 'vitest';
import {
  PaymentNotificationVerificationError,
  PaymentNotificationVerificationReason
} from '@/modules/payment/application/exceptions/payment-notification.exception';
import { PaymentGatewayPort } from '@/modules/payment/application/ports/payment-gateway.port';
import { VerifiedNotification } from '@/modules/payment/domain/entities/payment.types';
import { PaymentRepositoryPort } from '@/modules/payment/domain/repositories/payment.repository';
import { HandlePaymentNotificationUseCase } from '@/modules/payment/application/use-cases/handle-payment-notification/handle-payment-notification.usecase';

class FakePaymentGateway implements PaymentGatewayPort {
  createCheckout = vi.fn(async () => 'https://sandbox.example/checkout');
  verifyNotification = vi.fn((payload: unknown) => payload as VerifiedNotification);
}

function notification(overrides: Partial<VerifiedNotification> = {}): VerifiedNotification {
  return {
    provider: 'vnpay',
    providerOrderId: 'order-1',
    providerRequestId: 'request-1',
    amountVnd: 10_000,
    providerTransactionId: 'transaction-1',
    resultCode: '00',
    outcome: 'succeeded',
    ...overrides
  };
}

function setup() {
  const vnpay = new FakePaymentGateway();
  const momo = new FakePaymentGateway();
  const repository = { applyVerifiedOutcome: vi.fn() } as unknown as PaymentRepositoryPort;
  const useCase = new HandlePaymentNotificationUseCase(repository, { vnpay, momo });
  return { repository, vnpay, momo, useCase };
}

describe('HandlePaymentNotificationUseCase', () => {
  it.each([
    ['succeeded', 'applied'],
    ['failed', 'applied'],
    ['pending', 'applied'],
    ['cancelled', 'applied'],
    ['succeeded', 'duplicate'],
    ['succeeded', 'not_found'],
    ['succeeded', 'amount_mismatch'],
    ['succeeded', 'reference_mismatch'],
    ['succeeded', 'state_conflict']
  ] as const)('passes a verified %s notification through as %s', async (outcome, repositoryResult) => {
    const { repository, vnpay, momo, useCase } = setup();
    const verified = notification({ outcome });
    vnpay.verifyNotification.mockReturnValue(verified);
    vi.mocked(repository.applyVerifiedOutcome).mockResolvedValue(repositoryResult);

    await expect(useCase.execute({ provider: 'vnpay', payload: { signed: true } })).resolves.toBe(repositoryResult);

    expect(vnpay.verifyNotification).toHaveBeenCalledOnce();
    expect(vnpay.verifyNotification).toHaveBeenCalledWith({ signed: true });
    expect(momo.verifyNotification).not.toHaveBeenCalled();
    expect(repository.applyVerifiedOutcome).toHaveBeenCalledOnce();
    expect(repository.applyVerifiedOutcome).toHaveBeenCalledWith(verified);
  });

  it('handles concurrent identical callbacks by returning applied and duplicate repository outcomes', async () => {
    const { repository, vnpay, useCase } = setup();
    const verified = notification();
    vnpay.verifyNotification.mockReturnValue(verified);
    vi.mocked(repository.applyVerifiedOutcome).mockResolvedValueOnce('applied').mockResolvedValueOnce('duplicate');

    const results = await Promise.all([
      useCase.execute({ provider: 'vnpay', payload: { signed: true } }),
      useCase.execute({ provider: 'vnpay', payload: { signed: true } })
    ]);

    expect(results.sort()).toEqual(['applied', 'duplicate']);
    expect(repository.applyVerifiedOutcome).toHaveBeenCalledTimes(2);
  });

  it('applies a callback against a saved creating payment before checkout creation has returned', async () => {
    const { repository, vnpay, useCase } = setup();
    const earlyNotification = notification({ providerOrderId: 'saved-before-provider-call' });
    vnpay.verifyNotification.mockReturnValue(earlyNotification);
    vi.mocked(repository.applyVerifiedOutcome).mockResolvedValue('applied');

    await expect(useCase.execute({ provider: 'vnpay', payload: { signed: true } })).resolves.toBe('applied');

    expect(repository.applyVerifiedOutcome).toHaveBeenCalledWith(earlyNotification);
  });

  it.each<PaymentNotificationVerificationReason>(['invalid_signature', 'merchant_mismatch'])(
    'propagates a typed %s verification error without writing a payment',
    async (reason) => {
      const { repository, vnpay, useCase } = setup();
      const error = new PaymentNotificationVerificationError(reason);
      vnpay.verifyNotification.mockImplementation(() => {
        throw error;
      });

      await expect(useCase.execute({ provider: 'vnpay', payload: { invalid: true } })).rejects.toBe(error);
      expect(repository.applyVerifiedOutcome).not.toHaveBeenCalled();
    }
  );

  it('rejects malformed normalized references before persistence', async () => {
    const { repository, vnpay, useCase } = setup();
    vnpay.verifyNotification.mockReturnValue(notification({ providerOrderId: ' ' }));

    await expect(useCase.execute({ provider: 'vnpay', payload: {} })).rejects.toMatchObject({
      name: 'PaymentNotificationVerificationError',
      reason: 'invalid_payload'
    });
    expect(repository.applyVerifiedOutcome).not.toHaveBeenCalled();
  });

  it('propagates repository failures so the provider callback cannot be acknowledged as stored', async () => {
    const { repository, vnpay, useCase } = setup();
    const storageError = new Error('database unavailable');
    vnpay.verifyNotification.mockReturnValue(notification());
    vi.mocked(repository.applyVerifiedOutcome).mockRejectedValue(storageError);

    await expect(useCase.execute({ provider: 'vnpay', payload: { signed: true } })).rejects.toBe(storageError);
  });
});
