import type { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import type { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type { PaymentProvider } from '@/modules/payment/domain/entities/payment.types';
import {
  PaymentProviderTransactionConflictError,
  type PaymentRepositoryPort
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

  async save(payment: PaymentEntity): Promise<PaymentEntity | null> {
    const model = this.mapper.toPersistence(payment);
    try {
      // Only the state changed by the entity's domain methods; the version check rejects stale writes.
      const saved = await this.dbCollection.findOneAndUpdate(
        { _id: model._id, version: model.version, deleted_at: null },
        {
          $set: {
            status: model.status,
            checkout_url: model.checkout_url,
            provider_transaction_id: model.provider_transaction_id,
            provider_result_code: model.provider_result_code,
            updated_at: model.updated_at,
            updated_by_id: model.updated_by_id
          },
          $inc: { version: 1 }
        },
        { returnDocument: 'after' }
      );
      return saved ? this.mapper.toDomain(saved) : null;
    } catch (error) {
      // The provider transaction ID is the only unique field this update can change.
      if (this.isDuplicateKeyError(error)) {
        throw new PaymentProviderTransactionConflictError({ cause: error });
      }
      throw error;
    }
  }

  private isDuplicateKeyError(error: unknown): error is MongoServerError {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 11000;
  }
}
