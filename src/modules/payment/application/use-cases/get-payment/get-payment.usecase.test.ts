import { describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@/modules/core/domain/exceptions/exceptions';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import { PaymentRecord } from '@/modules/payment/domain/entities/payment.type';
import { PaymentRepositoryPort } from '@/modules/payment/domain/repositories/payment.repository';
import { GetPaymentUseCase } from '@/modules/payment/application/use-cases/get-payment/get-payment.usecase';

describe('GetPaymentUseCase', () => {
  const record = PaymentEntity.createExample({
    userId: 'user-a',
    provider: 'vnpay',
    idempotencyKey: 'key-a'
  }).toObject() as PaymentRecord;

  it('returns the payment to its owner', async () => {
    const repository = { findById: vi.fn().mockResolvedValue(record) } as unknown as PaymentRepositoryPort;
    const useCase = new GetPaymentUseCase(repository);

    await expect(useCase.execute({ userId: 'user-a', paymentId: record.id })).resolves.toBe(record);
  });

  it('returns not found when the payment does not exist', async () => {
    const repository = { findById: vi.fn().mockResolvedValue(null) } as unknown as PaymentRepositoryPort;
    const useCase = new GetPaymentUseCase(repository);

    await expect(useCase.execute({ userId: 'user-a', paymentId: record.id })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('returns the same not found result when another user owns the payment', async () => {
    const repository = { findById: vi.fn().mockResolvedValue(record) } as unknown as PaymentRepositoryPort;
    const useCase = new GetPaymentUseCase(repository);

    await expect(useCase.execute({ userId: 'user-b', paymentId: record.id })).rejects.toBeInstanceOf(NotFoundException);
  });
});
