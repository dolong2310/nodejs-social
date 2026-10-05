import { describe, expect, it, vi } from 'vitest';
import { ConflictException } from '@/modules/core/domain/exceptions/exceptions';
import {
  PaymentCheckoutError,
  type PaymentGatewayPort
} from '@/modules/payment/application/ports/payment-gateway.port';
import { CreatePaymentUseCase } from '@/modules/payment/application/use-cases/create-payment/create-payment.usecase';
import type {
  PaymentCheckoutProps,
  PaymentProvider,
  VerifiedNotification
} from '@/modules/payment/domain/entities/payment.types';
import { InMemoryPaymentRepository } from '@test/support/doubles/payment-repository.double';

let orderReferenceSequence = 0;

class FakePaymentGateway implements PaymentGatewayPort {
  createOrderReference = vi.fn((now: Date) => ({
    providerOrderId: `fake-order-${++orderReferenceSequence}`,
    expiresAt: new Date(now.getTime() + 60_000)
  }));

  createCheckout = vi.fn(async (_payment: PaymentCheckoutProps, _clientIp: string) => {
    void _payment;
    void _clientIp;
    return 'https://sandbox.test/checkout';
  });

  verifyNotification(payload: unknown): VerifiedNotification {
    return payload as VerifiedNotification;
  }
}

function setup() {
  const repository = new InMemoryPaymentRepository();
  const vnpay = new FakePaymentGateway();
  const momo = new FakePaymentGateway();
  const zalopay = new FakePaymentGateway();
  const useCase = new CreatePaymentUseCase(repository, { vnpay, momo, zalopay });
  return { repository, vnpay, momo, zalopay, useCase };
}

const request = (
  overrides: Partial<{
    userId: string;
    provider: PaymentProvider;
    sourceReference: string;
    description: string;
    amountVnd: number;
    idempotencyKey: string;
    clientIp: string;
  }> = {}
) => ({
  userId: 'u_payment_test',
  provider: 'vnpay' as PaymentProvider,
  sourceReference: 'order_client_1',
  description: 'Thanh toan don hang client 1',
  amountVnd: 150_000,
  idempotencyKey: 'payment-key-1',
  clientIp: '203.0.113.10',
  ...overrides
});

describe('CreatePaymentUseCase', () => {
  it('persists creating before calling the gateway and returns the checkout URL', async () => {
    const { repository, vnpay, useCase } = setup();
    vnpay.createCheckout.mockImplementation(async () => {
      repository.events.push('gateway');
      return 'https://sandbox.test/checkout';
    });

    const payment = await useCase.execute(request());

    expect(repository.events).toEqual(['persist', 'gateway', 'save']);
    expect(payment).toMatchObject({
      sourceReference: 'order_client_1',
      description: 'Thanh toan don hang client 1',
      amountVnd: 150_000,
      status: 'pending',
      checkoutUrl: 'https://sandbox.test/checkout'
    });
    expect(payment).not.toHaveProperty('userId');
    expect(payment).not.toHaveProperty('idempotencyKey');
    expect(vnpay.createCheckout).toHaveBeenCalledOnce();
  });

  it('stores the order reference chosen by the provider gateway', async () => {
    const { vnpay, useCase } = setup();
    const expiresAt = new Date('2026-10-03T00:15:00.000Z');
    vnpay.createOrderReference.mockReturnValueOnce({ providerOrderId: 'gateway-order-id', expiresAt });

    const payment = await useCase.execute(request());

    expect(vnpay.createOrderReference).toHaveBeenCalledOnce();
    expect(vnpay.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ providerOrderId: 'gateway-order-id', expiresAt }),
      '203.0.113.10'
    );
    expect(payment.expiresAt).toEqual(expiresAt);
  });

  it('returns the same payment for a repeated key and does not create another checkout', async () => {
    const { vnpay, useCase } = setup();
    const first = await useCase.execute(request());
    const retry = await useCase.execute(request());

    expect(retry.id).toBe(first.id);
    expect(retry.checkoutUrl).toBe(first.checkoutUrl);
    expect(vnpay.createCheckout).toHaveBeenCalledOnce();
  });

  it('rejects reuse of the key with a different provider', async () => {
    const { vnpay, momo, useCase } = setup();
    await useCase.execute(request());

    await expect(useCase.execute(request({ provider: 'momo' }))).rejects.toBeInstanceOf(ConflictException);
    expect(vnpay.createCheckout).toHaveBeenCalledOnce();
    expect(momo.createCheckout).not.toHaveBeenCalled();
  });

  it('rejects reuse of the key with different client-supplied payment details', async () => {
    const { vnpay, useCase } = setup();
    await useCase.execute(request());

    await expect(useCase.execute(request({ amountVnd: 200_000 }))).rejects.toBeInstanceOf(ConflictException);
    expect(vnpay.createCheckout).toHaveBeenCalledOnce();
  });

  it.each([
    new PaymentCheckoutError({ kind: 'uncertain', reason: 'timeout' }, 'provider timed out'),
    new Error('network unavailable')
  ])('retains unknown status after an uncertain gateway error and never retries it', async (error) => {
    const { repository, vnpay, useCase } = setup();
    vnpay.createCheckout.mockRejectedValue(error);

    const first = await useCase.execute(request());
    const retry = await useCase.execute(request());

    expect(first.status).toBe('unknown');
    expect(retry.id).toBe(first.id);
    expect(retry.status).toBe('unknown');
    expect(vnpay.createCheckout).toHaveBeenCalledOnce();
    expect((await repository.findPaymentById(first.id))?.getProps().status).toBe('unknown');
  });

  it('stores definitive provider rejection as create_failed and never retries it', async () => {
    const { repository, vnpay, useCase } = setup();
    vnpay.createCheckout.mockRejectedValue(
      new PaymentCheckoutError({ kind: 'definitive_rejection', resultCode: 'MERCHANT_REJECTED' }, 'rejected')
    );

    const first = await useCase.execute(request());
    const retry = await useCase.execute(request());

    expect(first.status).toBe('create_failed');
    expect(first).not.toHaveProperty('providerResultCode');
    expect(retry.id).toBe(first.id);
    expect(retry.status).toBe('create_failed');
    expect(vnpay.createCheckout).toHaveBeenCalledOnce();
    expect((await repository.findPaymentById(first.id))?.getProps()).toMatchObject({
      status: 'create_failed',
      providerResultCode: 'MERCHANT_REJECTED'
    });
  });

  it.each([
    { outcome: 'pending', expected: 'pending' },
    { outcome: 'succeeded', expected: 'succeeded' }
  ] as const)(
    'preserves an early $outcome IPN while attaching the returned checkout URL',
    async ({ outcome, expected }) => {
      const { repository, vnpay, useCase } = setup();
      // The provider callback is stored while createCheckout is still running, so the use case saves a stale version.
      vnpay.createCheckout.mockImplementation(async (payment) => {
        const stored = await repository.findPaymentByProviderOrderId(payment.provider, payment.providerOrderId);
        stored!.applyVerifiedOutcome({
          provider: payment.provider,
          providerOrderId: payment.providerOrderId,
          providerRequestId: payment.providerRequestId,
          amountVnd: payment.amountVnd,
          providerTransactionId: outcome === 'succeeded' ? 'txn-early' : null,
          resultCode: outcome === 'succeeded' ? '00' : '01',
          outcome
        });
        await repository.save(stored!);
        return 'https://sandbox.example/checkout';
      });

      const payment = await useCase.execute(request());

      expect(payment).toMatchObject({ status: expected, checkoutUrl: 'https://sandbox.example/checkout' });
    }
  );
  it('keeps an early success callback when checkout creation then fails without a definitive answer', async () => {
    const { repository, vnpay, useCase } = setup();
    vnpay.createCheckout.mockImplementation(async (payment) => {
      const stored = await repository.findPaymentByProviderOrderId(payment.provider, payment.providerOrderId);
      stored!.applyVerifiedOutcome({
        provider: payment.provider,
        providerOrderId: payment.providerOrderId,
        providerRequestId: payment.providerRequestId,
        amountVnd: payment.amountVnd,
        providerTransactionId: 'txn-early',
        resultCode: '00',
        outcome: 'succeeded'
      });
      await repository.save(stored!);
      throw new Error('network unavailable');
    });

    const payment = await useCase.execute(request());

    expect(payment.status).toBe('succeeded');
    expect(repository.statusOf(payment.id)).toBe('succeeded');
  });
});
