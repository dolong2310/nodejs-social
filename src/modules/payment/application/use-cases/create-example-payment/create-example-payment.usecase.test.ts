import { describe, expect, it, vi } from 'vitest';
import { ConflictException } from '@/modules/core/domain/exceptions/exceptions';
import { PaymentProvider, PaymentRecord, VerifiedNotification } from '@/modules/payment/domain/entities/payment.type';
import { PaymentCheckoutError, PaymentGatewayPort } from '@/modules/payment/application/ports/payment-gateway.port';
import { PaymentRepositoryPort } from '@/modules/payment/domain/repositories/payment.repository';
import { CreateExamplePaymentUseCase } from '@/modules/payment/application/use-cases/create-example-payment/create-example-payment.usecase';

class InMemoryPaymentRepository implements PaymentRepositoryPort {
  readonly records = new Map<string, PaymentRecord>();
  readonly events: string[] = [];

  async insertOrFindByIdempotency(record: PaymentRecord) {
    const existing = [...this.records.values()].find(
      (candidate) => candidate.userId === record.userId && candidate.idempotencyKey === record.idempotencyKey
    );
    if (existing) return { record: { ...existing }, inserted: false };
    this.records.set(record.id, { ...record });
    this.events.push('persist');
    return { record: { ...record }, inserted: true };
  }

  async findById(id: string) {
    const record = this.records.get(id);
    return record ? { ...record } : null;
  }

  async findByProviderOrderId(provider: PaymentProvider, orderId: string) {
    const record = [...this.records.values()].find(
      (candidate) => candidate.provider === provider && candidate.providerOrderId === orderId
    );
    return record ? { ...record } : null;
  }

  async attachCheckoutUrlIfAbsent(id: string, url: string) {
    const record = this.records.get(id);
    if (!record) throw new Error('record missing');
    if (!record.checkoutUrl) {
      record.checkoutUrl = url;
      if (record.status === 'creating') record.status = 'pending';
      record.version += 1;
    }
    return { ...record };
  }

  async setUnknownIfCreating(id: string) {
    const record = this.records.get(id);
    if (!record) throw new Error('record missing');
    if (record.status === 'creating') {
      record.status = 'unknown';
      record.version += 1;
    }
    return { ...record };
  }

  async setCreateFailedIfCreating(id: string, resultCode: string) {
    const record = this.records.get(id);
    if (!record) throw new Error('record missing');
    if (record.status === 'creating') {
      record.status = 'create_failed';
      record.providerResultCode = resultCode;
      record.version += 1;
    }
    return { ...record };
  }

  async applyVerifiedOutcome(input: VerifiedNotification) {
    const record = [...this.records.values()].find(
      (candidate) => candidate.provider === input.provider && candidate.providerOrderId === input.providerOrderId
    );
    if (!record) return 'not_found' as const;
    if (record.amountVnd !== input.amountVnd) return 'amount_mismatch' as const;
    if (input.providerRequestId && record.providerRequestId !== input.providerRequestId)
      return 'reference_mismatch' as const;
    if (record.status === input.outcome) return 'duplicate' as const;
    record.status = input.outcome;
    record.providerTransactionId = input.providerTransactionId;
    record.providerResultCode = input.resultCode;
    record.version += 1;
    return 'applied' as const;
  }
}

class FakePaymentGateway implements PaymentGatewayPort {
  createCheckout = vi.fn(async (_record: PaymentRecord, _clientIp: string) => {
    void _record;
    void _clientIp;
    return 'https://sandbox.example/checkout';
  });
  verifyNotification(payload: unknown): VerifiedNotification {
    return payload as VerifiedNotification;
  }
}

function setup() {
  const repository = new InMemoryPaymentRepository();
  const vnpay = new FakePaymentGateway();
  const momo = new FakePaymentGateway();
  const useCase = new CreateExamplePaymentUseCase(repository, { vnpay, momo });
  return { repository, vnpay, momo, useCase };
}

const request = (
  overrides: Partial<{ userId: string; provider: PaymentProvider; idempotencyKey: string; clientIp: string }> = {}
) => ({
  userId: 'u_payment_test',
  provider: 'vnpay' as PaymentProvider,
  idempotencyKey: 'payment-key-1',
  clientIp: '203.0.113.10',
  ...overrides
});

describe('CreateExamplePaymentUseCase', () => {
  it('persists creating before calling the gateway and returns the checkout URL', async () => {
    const { repository, vnpay, useCase } = setup();
    vnpay.createCheckout.mockImplementation(async () => {
      repository.events.push('gateway');
      return 'https://sandbox.example/checkout';
    });

    const payment = await useCase.execute(request());

    expect(repository.events).toEqual(['persist', 'gateway']);
    expect(payment).toMatchObject({ status: 'pending', checkoutUrl: 'https://sandbox.example/checkout' });
    expect(vnpay.createCheckout).toHaveBeenCalledOnce();
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
    expect((await repository.findById(first.id))?.status).toBe('unknown');
  });

  it('stores definitive provider rejection as create_failed and never retries it', async () => {
    const { repository, vnpay, useCase } = setup();
    vnpay.createCheckout.mockRejectedValue(
      new PaymentCheckoutError({ kind: 'definitive_rejection', resultCode: 'MERCHANT_REJECTED' }, 'rejected')
    );

    const first = await useCase.execute(request());
    const retry = await useCase.execute(request());

    expect(first).toMatchObject({ status: 'create_failed', providerResultCode: 'MERCHANT_REJECTED' });
    expect(retry.id).toBe(first.id);
    expect(vnpay.createCheckout).toHaveBeenCalledOnce();
    expect((await repository.findById(first.id))?.status).toBe('create_failed');
  });

  it.each([
    { outcome: 'pending', expected: 'pending' },
    { outcome: 'succeeded', expected: 'succeeded' }
  ] as const)(
    'preserves an early $outcome IPN while attaching the returned checkout URL',
    async ({ outcome, expected }) => {
      const { repository, vnpay, useCase } = setup();
      vnpay.createCheckout.mockImplementation(async (record) => {
        await repository.applyVerifiedOutcome({
          provider: record.provider,
          providerOrderId: record.providerOrderId,
          providerRequestId: record.providerRequestId,
          amountVnd: record.amountVnd,
          providerTransactionId: outcome === 'succeeded' ? 'txn-early' : null,
          resultCode: outcome === 'succeeded' ? '00' : '01',
          outcome
        });
        return 'https://sandbox.example/checkout';
      });

      const payment = await useCase.execute(request());

      expect(payment).toMatchObject({ status: expected, checkoutUrl: 'https://sandbox.example/checkout' });
    }
  );
});
