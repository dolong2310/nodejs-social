import { describe, expect, it, vi } from 'vitest';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { ConflictException } from '@/modules/core/domain/exceptions/exceptions';
import { PaymentCheckoutError, type PaymentGatewayPort } from '@/modules/payment/application/ports/payment-gateway.port';
import { CreatePaymentUseCase } from '@/modules/payment/application/use-cases/create-payment/create-payment.usecase';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type { PaymentCheckoutProps, PaymentFullProps, PaymentProps, PaymentProvider, VerifiedNotification } from '@/modules/payment/domain/entities/payment.types';
import type { PaymentRepositoryPort } from '@/modules/payment/domain/repositories/payment.repository';

function toPaymentEntity(payment: PaymentFullProps): PaymentEntity {
  const { id, createdAt, createdById, updatedAt, updatedById, deletedAt, deletedById, ...props } = payment;
  return new PaymentEntity({
    id: new UniqueEntityID(id),
    createdAt,
    createdById,
    updatedAt,
    updatedById,
    deletedAt,
    deletedById,
    props: props as PaymentProps
  });
}

class InMemoryPaymentRepository implements PaymentRepositoryPort {
  readonly payments = new Map<string, PaymentFullProps>();
  readonly events: string[] = [];

  async insertOrFindByIdempotency(payment: PaymentEntity) {
    const candidate = payment.toObject<PaymentFullProps>();
    const existing = [...this.payments.values()].find(
      (stored) => stored.userId === candidate.userId && stored.idempotencyKey === candidate.idempotencyKey
    );
    if (existing) return { payment: toPaymentEntity(existing), inserted: false };
    this.payments.set(candidate.id, { ...candidate });
    this.events.push('persist');
    return { payment: toPaymentEntity(candidate), inserted: true };
  }

  async findPaymentById(id: string) {
    const payment = this.payments.get(id);
    return payment ? toPaymentEntity(payment) : null;
  }

  async findPaymentByProviderOrderId(provider: PaymentProvider, orderId: string) {
    const payment = [...this.payments.values()].find(
      (candidate) => candidate.provider === provider && candidate.providerOrderId === orderId
    );
    return payment ? toPaymentEntity(payment) : null;
  }

  async attachCheckoutUrlIfAbsent(id: string, url: string) {
    const payment = this.requirePayment(id);
    const updated: PaymentFullProps = {
      ...payment,
      checkoutUrl: payment.checkoutUrl ?? url,
      status: !payment.checkoutUrl && payment.status === 'creating' ? 'pending' : payment.status,
      updatedAt: new Date(),
      version: payment.version + (payment.checkoutUrl ? 0 : 1)
    };
    this.payments.set(id, updated);
    return toPaymentEntity(updated);
  }

  async setUnknownIfCreating(id: string) {
    const payment = this.requirePayment(id);
    const updated: PaymentFullProps = {
      ...payment,
      status: payment.status === 'creating' ? 'unknown' : payment.status,
      updatedAt: new Date(),
      version: payment.version + (payment.status === 'creating' ? 1 : 0)
    };
    this.payments.set(id, updated);
    return toPaymentEntity(updated);
  }

  async setCreateFailedIfCreating(id: string, resultCode: string) {
    const payment = this.requirePayment(id);
    const isCreating = payment.status === 'creating';
    const updated: PaymentFullProps = {
      ...payment,
      status: isCreating ? 'create_failed' : payment.status,
      providerResultCode: isCreating ? resultCode : payment.providerResultCode,
      updatedAt: new Date(),
      version: payment.version + (isCreating ? 1 : 0)
    };
    this.payments.set(id, updated);
    return toPaymentEntity(updated);
  }

  async applyVerifiedOutcome(input: VerifiedNotification) {
    const payment = [...this.payments.values()].find(
      (candidate) => candidate.provider === input.provider && candidate.providerOrderId === input.providerOrderId
    );
    if (!payment) return 'not_found' as const;
    if (payment.amountVnd !== input.amountVnd) return 'amount_mismatch' as const;
    if (input.providerRequestId !== undefined && payment.providerRequestId !== input.providerRequestId) {
      return 'reference_mismatch' as const;
    }
    if (payment.status === input.outcome) return 'duplicate' as const;
    if (['succeeded', 'failed', 'cancelled', 'create_failed'].includes(payment.status))
      return 'state_conflict' as const;
    this.payments.set(payment.id, {
      ...payment,
      status: input.outcome,
      providerTransactionId: input.providerTransactionId,
      providerResultCode: input.resultCode,
      updatedAt: new Date(),
      version: payment.version + 1
    });
    return 'applied' as const;
  }

  private requirePayment(id: string): PaymentFullProps {
    const payment = this.payments.get(id);
    if (!payment) throw new Error('payment missing');
    return payment;
  }
}

class FakePaymentGateway implements PaymentGatewayPort {
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
  const useCase = new CreatePaymentUseCase(repository, { vnpay, momo });
  return { repository, vnpay, momo, useCase };
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

    expect(repository.events).toEqual(['persist', 'gateway']);
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
      vnpay.createCheckout.mockImplementation(async (payment) => {
        await repository.applyVerifiedOutcome({
          provider: payment.provider,
          providerOrderId: payment.providerOrderId,
          providerRequestId: payment.providerRequestId,
          amountVnd: payment.amountVnd,
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
