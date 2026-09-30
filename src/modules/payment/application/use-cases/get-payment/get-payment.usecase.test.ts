import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@/modules/core/domain/exceptions/exceptions';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import { PaymentRepositoryPort } from '@/modules/payment/domain/repositories/payment.repository';
import { GetPaymentUseCase } from '@/modules/payment/application/use-cases/get-payment/get-payment.usecase';

describe('GetPaymentUseCase', () => {
  const payment = PaymentEntity.create({
    userId: 'user-a',
    provider: 'vnpay',
    sourceReference: 'order_get_payment',
    description: 'Get payment use case order',
    amountVnd: 10_000,
    idempotencyKey: 'key-a'
  });

  it('returns only safe payment properties to its owner', async () => {
    const repository = { findPaymentById: vi.fn().mockResolvedValue(payment) } as unknown as PaymentRepositoryPort;
    const useCase = new GetPaymentUseCase(repository);

    const result = await useCase.execute({ userId: 'user-a', paymentId: payment.id.toString() });

    expect(result).toMatchObject({ id: payment.id.toString(), provider: 'vnpay', status: 'creating' });
    expect(result).not.toHaveProperty('userId');
    expect(result).not.toHaveProperty('idempotencyKey');
  });

  it('returns not found when the payment does not exist', async () => {
    const repository = { findPaymentById: vi.fn().mockResolvedValue(null) } as unknown as PaymentRepositoryPort;
    const useCase = new GetPaymentUseCase(repository);

    await expect(useCase.execute({ userId: 'user-a', paymentId: payment.id.toString() })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the same not found result when another user owns the payment', async () => {
    const repository = { findPaymentById: vi.fn().mockResolvedValue(payment) } as unknown as PaymentRepositoryPort;
    const useCase = new GetPaymentUseCase(repository);

    await expect(useCase.execute({ userId: 'user-b', paymentId: payment.id.toString() })).rejects.toBeInstanceOf(NotFoundException);
  });
});
