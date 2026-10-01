import {
  down as downMongoPaymentMigration,
  up as upMongoPaymentMigration
} from '@/infrastructure/persistence/mongodb/migrations/20260924000000-payments';
import {
  down as downMongoPaymentSourceMigration,
  up as upMongoPaymentSourceMigration
} from '@/infrastructure/persistence/mongodb/migrations/20260925000000-payments-source-type-order';
import {
  down as downMongoPaymentAuditMigration,
  up as upMongoPaymentAuditMigration
} from '@/infrastructure/persistence/mongodb/migrations/20260929000000-payments-audit';
import {
  down as downPostgresPaymentMigration,
  up as upPostgresPaymentMigration
} from '@/infrastructure/persistence/postgres/migrations/20260924000000-payments';
import {
  down as downPostgresPaymentSourceMigration,
  up as upPostgresPaymentSourceMigration
} from '@/infrastructure/persistence/postgres/migrations/20260925000000-payments-source-type-order';
import {
  down as downPostgresPaymentAuditMigration,
  up as upPostgresPaymentAuditMigration
} from '@/infrastructure/persistence/postgres/migrations/20260929000000-payments-audit';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import type { PaymentFullProps, PaymentProps, PaymentProvider, VerifiedNotification } from '@/modules/payment/domain/entities/payment.types';
import { PaymentRepository as MongoPaymentRepository } from '@/modules/payment/infrastructure/persistence/mongo/payment.impl.repository';
import { PaymentMapper as MongoPaymentMapper } from '@/modules/payment/infrastructure/persistence/mongo/payment.mapper';
import type { PaymentModel as MongoPaymentModel } from '@/modules/payment/infrastructure/persistence/mongo/payment.model';
import { PaymentRepository as PostgresPaymentRepository } from '@/modules/payment/infrastructure/persistence/postgres/payment.impl.repository';
import { PaymentMapper as PostgresPaymentMapper } from '@/modules/payment/infrastructure/persistence/postgres/payment.mapper';
import type { PaymentModel as PostgresPaymentModel } from '@/modules/payment/infrastructure/persistence/postgres/payment.model';
import { MongoClient } from 'mongodb';
import { randomUUID } from 'node:crypto';
import { Pool } from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const mongoUri = process.env.PAYMENT_TEST_MONGO_URI;
const postgresUri = process.env.PAYMENT_TEST_POSTGRES_URI;

function newPayment(
  userId = 'u_payment_test',
  provider: PaymentProvider = 'vnpay',
  key: string = randomUUID()
): PaymentEntity {
  return PaymentEntity.create({
    userId,
    provider,
    sourceReference: `order_${key}`,
    description: 'Repository payment order',
    amountVnd: 10_000,
    idempotencyKey: key
  });
}

function withPaymentProps(payment: PaymentEntity, changes: Partial<PaymentFullProps>): PaymentEntity {
  const { id, createdAt, createdById, updatedAt, updatedById, deletedAt, deletedById, ...props } = {
    ...payment.toObject<PaymentFullProps>(),
    ...changes
  };
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

function props(payment: PaymentEntity) {
  return payment.getProps();
}

describe('PaymentMapper', () => {
  it('maps a payment to and from a Mongo model and rejects an unknown persisted status', () => {
    const mapper = new MongoPaymentMapper();
    const payment = newPayment();
    const model = mapper.toPersistence(payment);
    const restored = mapper.toDomain(model);

    expect(restored.toObject()).toMatchObject({
      id: payment.id.toString(),
      sourceType: props(payment).sourceType,
      sourceReference: props(payment).sourceReference,
      description: props(payment).description,
      amountVnd: props(payment).amountVnd,
      status: props(payment).status
    });
    expect(() => mapper.toDomain({ ...model, status: 'unexpected' } as unknown as MongoPaymentModel)).toThrow();
  });

  it('maps a payment to and from a PostgreSQL model and rejects an unknown persisted status', () => {
    const mapper = new PostgresPaymentMapper();
    const payment = newPayment();
    const model = mapper.toPersistence(payment);
    const restored = mapper.toDomain(model);

    expect(restored.toObject()).toMatchObject({
      id: payment.id.toString(),
      sourceType: props(payment).sourceType,
      sourceReference: props(payment).sourceReference,
      description: props(payment).description,
      amountVnd: props(payment).amountVnd,
      status: props(payment).status
    });
    expect(() => mapper.toDomain({ ...model, status: 'unexpected' } as unknown as PostgresPaymentModel)).toThrow();
  });
});

function notification(
  record: PaymentEntity,
  outcome: VerifiedNotification['outcome'] = 'succeeded',
  overrides: Partial<VerifiedNotification> = {}
): VerifiedNotification {
  return {
    provider: props(record).provider,
    providerOrderId: props(record).providerOrderId,
    providerRequestId: props(record).providerRequestId,
    amountVnd: props(record).amountVnd,
    providerTransactionId: `9007199254740993-${props(record).providerOrderId}`,
    resultCode: outcome === 'succeeded' ? '00' : outcome === 'pending' ? '01' : outcome === 'cancelled' ? '24' : '05',
    outcome,
    ...overrides
  };
}

async function runRepositoryContract(
  label: string,
  createRepository: () => Promise<{
    repository: MongoPaymentRepository | PostgresPaymentRepository;
    cleanup: () => Promise<void>;
  }>
) {
  describe(label, () => {
    let repository: MongoPaymentRepository | PostgresPaymentRepository;
    let cleanup: () => Promise<void>;

    beforeAll(async () => {
      const resources = await createRepository();
      repository = resources.repository;
      cleanup = resources.cleanup;
    });

    afterAll(async () => {
      await cleanup?.();
    });

    it('creates one payment when two inserts race on the same user and idempotency key', async () => {
      const first = newPayment('u_race', 'vnpay', 'same-key');
      const second = newPayment('u_race', 'vnpay', 'same-key');

      const results = await Promise.all([
        repository.insertOrFindByIdempotency(first),
        repository.insertOrFindByIdempotency(second)
      ]);

      expect(results.filter((result) => result.inserted)).toHaveLength(1);
      expect(results[0]!.payment.id.toString()).toBe(results[1]!.payment.id.toString());
    });

    it('returns the existing record when an idempotency key is reused with another provider', async () => {
      const original = newPayment('u_idempotency', 'vnpay', 'shared-key');
      await repository.insertOrFindByIdempotency(original);

      const retry = newPayment('u_idempotency', 'momo', 'shared-key');
      const result = await repository.insertOrFindByIdempotency(retry);

      expect(result.inserted).toBe(false);
      expect(result.payment.id.toString()).toBe(original.id.toString());
      expect(props(result.payment).provider).toBe('vnpay');
    });

    it('applies concurrent identical success notifications once and classifies the retry as duplicate', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.payment);

      const results = await Promise.all([
        repository.applyVerifiedOutcome(notification(record)),
        repository.applyVerifiedOutcome(notification(record))
      ]);

      expect(results.sort()).toEqual(['applied', 'duplicate']);
      expect((await repository.findPaymentById(record.id.toString()))?.getProps().status).toBe('succeeded');
    });

    it('rejects a failure callback after success without reversing the result', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.payment);
      await repository.applyVerifiedOutcome(notification(record));

      expect(await repository.applyVerifiedOutcome(notification(record, 'failed'))).toBe('state_conflict');
      expect((await repository.findPaymentById(record.id.toString()))?.getProps().status).toBe('succeeded');
    });

    it('rejects a second provider transaction ID for an already successful order', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.payment);
      await repository.applyVerifiedOutcome(notification(record));

      expect(
        await repository.applyVerifiedOutcome(
          notification(record, 'succeeded', { providerTransactionId: '9007199254740994' })
        )
      ).toBe('state_conflict');
    });

    it('classifies a provider transaction ID race across different orders as a state conflict', async () => {
      const first = await repository
        .insertOrFindByIdempotency(newPayment('u_tx_race_first'))
        .then((result) => result.payment);
      const second = await repository
        .insertOrFindByIdempotency(newPayment('u_tx_race_second'))
        .then((result) => result.payment);
      const sharedTransactionId = 'shared-provider-transaction';

      const results = await Promise.all([
        repository.applyVerifiedOutcome(
          notification(first, 'succeeded', { providerTransactionId: sharedTransactionId })
        ),
        repository.applyVerifiedOutcome(
          notification(second, 'succeeded', { providerTransactionId: sharedTransactionId })
        )
      ]);

      expect(results.sort()).toEqual(['applied', 'state_conflict']);
      const statuses = await Promise.all([
        repository.findPaymentById(first.id.toString()),
        repository.findPaymentById(second.id.toString())
      ]);
      expect(statuses.map((payment) => payment?.getProps().status).sort()).toEqual(['creating', 'succeeded']);
    });

    it('treats a stale pending callback after success as a harmless duplicate', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.payment);
      await repository.applyVerifiedOutcome(notification(record));

      expect(await repository.applyVerifiedOutcome(notification(record, 'pending'))).toBe('duplicate');
      expect((await repository.findPaymentById(record.id.toString()))?.getProps().status).toBe('succeeded');
    });

    it('attaches the checkout URL and transitions a creating payment to pending', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.payment);

      const updated = await repository.attachCheckoutUrlIfAbsent(
        record.id.toString(),
        'https://sandbox.example/checkout'
      );

      expect(updated.getProps().status).toBe('pending');
      expect(updated.getProps().checkoutUrl).toBe('https://sandbox.example/checkout');
    });

    it('stores the checkout URL when pending IPN arrives before create returns', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.payment);
      await repository.applyVerifiedOutcome(notification(record, 'pending'));

      const updated = await repository.attachCheckoutUrlIfAbsent(
        record.id.toString(),
        'https://sandbox.example/checkout'
      );

      expect(updated.getProps().status).toBe('pending');
      expect(updated.getProps().checkoutUrl).toBe('https://sandbox.example/checkout');
    });

    it('attaches the checkout URL without changing an early successful result', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.payment);
      await repository.applyVerifiedOutcome(notification(record));

      const updated = await repository.attachCheckoutUrlIfAbsent(
        record.id.toString(),
        'https://sandbox.example/checkout'
      );

      expect(updated.getProps().status).toBe('succeeded');
      expect(updated.getProps().checkoutUrl).toBe('https://sandbox.example/checkout');
    });

    it('distinguishes missing orders, amount mismatch, and request reference mismatch', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.payment);

      expect(
        await repository.applyVerifiedOutcome(notification(record, 'succeeded', { providerOrderId: 'missing' }))
      ).toBe('not_found');
      expect(await repository.applyVerifiedOutcome(notification(record, 'succeeded', { amountVnd: 1 }))).toBe(
        'amount_mismatch'
      );
      expect(
        await repository.applyVerifiedOutcome(notification(record, 'succeeded', { providerRequestId: 'wrong-request' }))
      ).toBe('reference_mismatch');
      expect((await repository.findPaymentById(record.id.toString()))?.getProps().status).toBe('creating');
    });

    it('keeps provider transaction IDs as strings beyond SQL integer range', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.payment);

      expect(await repository.applyVerifiedOutcome(notification(record))).toBe('applied');
      expect((await repository.findPaymentById(record.id.toString()))?.getProps().providerTransactionId).toBe(
        `9007199254740993-${props(record).providerOrderId}`
      );
    });

    it('sets unknown and definitive creation failure only while the payment is creating', async () => {
      const uncertain = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.payment);
      expect((await repository.setUnknownIfCreating(uncertain.id.toString())).getProps().status).toBe('unknown');
      expect(
        (await repository.setCreateFailedIfCreating(uncertain.id.toString(), 'merchant_rejected')).getProps().status
      ).toBe('unknown');

      const rejected = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.payment);
      expect(
        (await repository.setCreateFailedIfCreating(rejected.id.toString(), 'merchant_rejected')).getProps().status
      ).toBe('create_failed');
      expect((await repository.findPaymentById(rejected.id.toString()))?.getProps().providerResultCode).toBe(
        'merchant_rejected'
      );
    });

    it('allows the same provider order reference in separate provider namespaces', async () => {
      const vnpay = withPaymentProps(newPayment('u_vnpay', 'vnpay'), { providerOrderId: 'shared-order-id' });
      const momo = withPaymentProps(newPayment('u_momo', 'momo'), { providerOrderId: 'shared-order-id' });

      await repository.insertOrFindByIdempotency(vnpay);
      await repository.insertOrFindByIdempotency(momo);

      expect((await repository.findPaymentByProviderOrderId('vnpay', 'shared-order-id'))?.id.toString()).toBe(
        vnpay.id.toString()
      );
      expect((await repository.findPaymentByProviderOrderId('momo', 'shared-order-id'))?.id.toString()).toBe(
        momo.id.toString()
      );
    });
  });
}

if (mongoUri) {
  await runRepositoryContract('Mongo payment repository', async () => {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(`payment_contract_${randomUUID().replaceAll('-', '')}`);
    await upMongoPaymentMigration({ context: db });
    await upMongoPaymentSourceMigration({ context: db });
    await upMongoPaymentAuditMigration({ context: db });
    return {
      repository: new MongoPaymentRepository(db, client, new MongoPaymentMapper(), {} as never),
      cleanup: async () => {
        await downMongoPaymentAuditMigration({ context: db });
        await downMongoPaymentSourceMigration({ context: db });
        await downMongoPaymentMigration({ context: db });
        await db.dropDatabase();
        await client.close();
      }
    };
  });
} else {
  describe.skip('Mongo payment repository (set PAYMENT_TEST_MONGO_URI to run integration contract)', () => {});
}

if (postgresUri) {
  await runRepositoryContract('PostgreSQL payment repository', async () => {
    const schema = `payment_contract_${randomUUID().replaceAll('-', '')}`;
    const adminPool = new Pool({ connectionString: postgresUri });
    await adminPool.query(`CREATE SCHEMA ${schema}`);
    const pool = new Pool({ connectionString: postgresUri, options: `-c search_path=${schema}` });
    await upPostgresPaymentMigration({ context: pool });
    await upPostgresPaymentSourceMigration({ context: pool });
    await upPostgresPaymentAuditMigration({ context: pool });
    return {
      repository: new PostgresPaymentRepository(pool, new PostgresPaymentMapper(), {} as never),
      cleanup: async () => {
        await downPostgresPaymentAuditMigration({ context: pool });
        await downPostgresPaymentSourceMigration({ context: pool });
        await downPostgresPaymentMigration({ context: pool });
        await pool.end();
        await adminPool.query(`DROP SCHEMA ${schema} CASCADE`);
        await adminPool.end();
      }
    };
  });
} else {
  describe.skip('PostgreSQL payment repository (set PAYMENT_TEST_POSTGRES_URI to run integration contract)', () => {});
}
