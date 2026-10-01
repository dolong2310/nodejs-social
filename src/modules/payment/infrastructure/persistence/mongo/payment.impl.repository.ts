import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import {
  classifyExistingPaymentNotification,
  MUTABLE_PAYMENT_STATUSES,
  normalizeProviderTransactionId,
  URL_ATTACHABLE_PAYMENT_STATUSES
} from '@/modules/payment/domain/helpers/payment.policy';
import type { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type { PaymentProvider, VerifiedNotification } from '@/modules/payment/domain/entities/payment.types';
import type {
  ApplyVerifiedOutcomeResult,
  PaymentRepositoryPort
} from '@/modules/payment/domain/repositories/payment.repository';
import type { PaymentMapper } from '@/modules/payment/infrastructure/persistence/mongo/payment.mapper';
import type { PaymentModel } from '@/modules/payment/infrastructure/persistence/mongo/payment.model';
import type { Db, MongoClient, MongoServerError } from 'mongodb';

export class PaymentRepository
  extends MongoRepositoryBase<PaymentEntity, PaymentModel>
  implements PaymentRepositoryPort
{
  protected collectionName = 'payments';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: PaymentMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async insertOrFindByIdempotency(payment: PaymentEntity): Promise<{ payment: PaymentEntity; inserted: boolean }> {
    try {
      const insertedPayment = await this.insert(payment);
      return { payment: insertedPayment, inserted: true };
    } catch (error) {
      if (!this.isDuplicateKeyError(error)) throw error;
      const existingPayment = await this.findOne({
        userId: payment.getProps().userId,
        idempotencyKey: payment.getProps().idempotencyKey
      } as Partial<PaymentEntity>);
      if (!existingPayment) throw error;
      return { payment: existingPayment, inserted: false };
    }
  }

  async findPaymentById(id: string): Promise<PaymentEntity | null> {
    return this.findById(id);
  }

  async findPaymentByProviderOrderId(provider: PaymentProvider, orderId: string): Promise<PaymentEntity | null> {
    return this.findOne({ provider, providerOrderId: orderId } as Partial<PaymentEntity>);
  }

  async attachCheckoutUrlIfAbsent(id: string, url: string): Promise<PaymentEntity> {
    await this.dbCollection.updateOne(
      { _id: id, checkout_url: null, status: 'creating', deleted_at: null },
      {
        $set: { checkout_url: url, status: 'pending', updated_at: new Date(), updated_by_id: null },
        $inc: { version: 1 }
      },
      { session: this.session }
    );
    await this.dbCollection.updateOne(
      {
        _id: id,
        checkout_url: null,
        status: { $in: URL_ATTACHABLE_PAYMENT_STATUSES.filter((status) => status !== 'creating') },
        deleted_at: null
      },
      { $set: { checkout_url: url, updated_at: new Date(), updated_by_id: null }, $inc: { version: 1 } },
      { session: this.session }
    );
    return this.requirePayment(id);
  }

  async setUnknownIfCreating(id: string): Promise<PaymentEntity> {
    await this.dbCollection.updateOne(
      { _id: id, status: 'creating', deleted_at: null },
      { $set: { status: 'unknown', updated_at: new Date(), updated_by_id: null }, $inc: { version: 1 } },
      { session: this.session }
    );
    return this.requirePayment(id);
  }

  async setCreateFailedIfCreating(id: string, resultCode: string): Promise<PaymentEntity> {
    await this.dbCollection.updateOne(
      { _id: id, status: 'creating', deleted_at: null },
      {
        $set: {
          status: 'create_failed',
          provider_result_code: resultCode,
          updated_at: new Date(),
          updated_by_id: null
        },
        $inc: { version: 1 }
      },
      { session: this.session }
    );
    return this.requirePayment(id);
  }

  async applyVerifiedOutcome(input: VerifiedNotification): Promise<ApplyVerifiedOutcomeResult> {
    const currentPayment = await this.findPaymentByProviderOrderId(input.provider, input.providerOrderId);
    if (!currentPayment) return 'not_found';
    const current = currentPayment.getProps();
    if (current.amountVnd !== input.amountVnd) return 'amount_mismatch';
    if (input.providerRequestId !== undefined && current.providerRequestId !== input.providerRequestId) {
      return 'reference_mismatch';
    }

    const existingResult = classifyExistingPaymentNotification(current, input);
    if (existingResult) return existingResult;

    try {
      const updatedPayment = await this.dbCollection.findOneAndUpdate(
        {
          _id: current.id.toString(),
          version: current.version,
          status: { $in: MUTABLE_PAYMENT_STATUSES },
          deleted_at: null
        },
        {
          $set: {
            status: input.outcome,
            provider_transaction_id: normalizeProviderTransactionId(input.providerTransactionId),
            provider_result_code: input.resultCode,
            updated_at: new Date(),
            updated_by_id: null
          },
          $inc: { version: 1 }
        },
        { returnDocument: 'after', session: this.session }
      );
      if (updatedPayment) return 'applied';
    } catch (error) {
      if (this.isDuplicateKeyError(error)) return 'state_conflict';
      throw error;
    }

    const latestPayment = await this.findById(current.id.toString());
    if (!latestPayment) return 'not_found';
    return classifyExistingPaymentNotification(latestPayment.getProps(), input) ?? 'state_conflict';
  }

  private async requirePayment(id: string): Promise<PaymentEntity> {
    const payment = await this.findPaymentById(id);
    if (!payment) throw new Error(`Payment ${id} was not found`);
    return payment;
  }

  private isDuplicateKeyError(error: unknown): error is MongoServerError {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
}
