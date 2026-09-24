import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { MongoClient } from 'mongodb';
import { Pool } from 'pg';
import { PaymentEntity } from '@/modules/payment/domain/entities/payment.entity';
import { PaymentProvider, PaymentRecord, VerifiedNotification } from '@/modules/payment/domain/entities/payment.type';
import { MongoPaymentRepository } from '@/modules/payment/infrastructure/persistence/mongo/payment.impl.repository';
import { PostgresPaymentRepository } from '@/modules/payment/infrastructure/persistence/postgres/payment.impl.repository';
import { down as downMongoPaymentMigration } from '@/infrastructure/persistence/mongodb/migrations/20260924000000-payments';
import { up as upMongoPaymentMigration } from '@/infrastructure/persistence/mongodb/migrations/20260924000000-payments';
import { down as downPostgresPaymentMigration } from '@/infrastructure/persistence/postgres/migrations/20260924000000-payments';
import { up as upPostgresPaymentMigration } from '@/infrastructure/persistence/postgres/migrations/20260924000000-payments';

const mongoUri = process.env.PAYMENT_TEST_MONGO_URI;
const postgresUri = process.env.PAYMENT_TEST_POSTGRES_URI;

function newPayment(
  userId = 'u_payment_test',
  provider: PaymentProvider = 'vnpay',
  key: string = randomUUID()
): PaymentRecord {
  return PaymentEntity.createExample({ userId, provider, idempotencyKey: key }).toObject() as PaymentRecord;
}

function notification(
  record: PaymentRecord,
  outcome: VerifiedNotification['outcome'] = 'succeeded',
  overrides: Partial<VerifiedNotification> = {}
): VerifiedNotification {
  return {
    provider: record.provider,
    providerOrderId: record.providerOrderId,
    providerRequestId: record.providerRequestId,
    amountVnd: record.amountVnd,
    providerTransactionId: `9007199254740993-${record.providerOrderId}`,
    resultCode: outcome === 'succeeded' ? '00' : outcome === 'pending' ? '01' : outcome === 'cancelled' ? '24' : '05',
    outcome,
    ...overrides
  };
}

async function runRepositoryContract(
  label: string,
  createRepository: () => Promise<{ repository: MongoPaymentRepository | PostgresPaymentRepository; cleanup: () => Promise<void> }>
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
      const second = { ...first, id: `${first.id}-second`, providerOrderId: `${first.providerOrderId}-second` };

      const results = await Promise.all([
        repository.insertOrFindByIdempotency(first),
        repository.insertOrFindByIdempotency(second)
      ]);

      expect(results.filter((result) => result.inserted)).toHaveLength(1);
      expect(results[0]!.record.id).toBe(results[1]!.record.id);
    });

    it('returns the existing record when an idempotency key is reused with another provider', async () => {
      const original = newPayment('u_idempotency', 'vnpay', 'shared-key');
      await repository.insertOrFindByIdempotency(original);

      const retry = newPayment('u_idempotency', 'momo', 'shared-key');
      const result = await repository.insertOrFindByIdempotency(retry);

      expect(result.inserted).toBe(false);
      expect(result.record.id).toBe(original.id);
      expect(result.record.provider).toBe('vnpay');
    });

    it('applies concurrent identical success notifications once and classifies the retry as duplicate', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.record);

      const results = await Promise.all([
        repository.applyVerifiedOutcome(notification(record)),
        repository.applyVerifiedOutcome(notification(record))
      ]);

      expect(results.sort()).toEqual(['applied', 'duplicate']);
      expect((await repository.findById(record.id))?.status).toBe('succeeded');
    });

    it('rejects a failure callback after success without reversing the result', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.record);
      await repository.applyVerifiedOutcome(notification(record));

      expect(await repository.applyVerifiedOutcome(notification(record, 'failed'))).toBe('state_conflict');
      expect((await repository.findById(record.id))?.status).toBe('succeeded');
    });

    it('rejects a second provider transaction ID for an already successful order', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.record);
      await repository.applyVerifiedOutcome(notification(record));

      expect(
        await repository.applyVerifiedOutcome(
          notification(record, 'succeeded', { providerTransactionId: '9007199254740994' })
        )
      ).toBe('state_conflict');
    });

    it('classifies a provider transaction ID race across different orders as a state conflict', async () => {
      const first = await repository.insertOrFindByIdempotency(newPayment('u_tx_race_first')).then((result) => result.record);
      const second = await repository.insertOrFindByIdempotency(newPayment('u_tx_race_second')).then((result) => result.record);
      const sharedTransactionId = 'shared-provider-transaction';

      const results = await Promise.all([
        repository.applyVerifiedOutcome(notification(first, 'succeeded', { providerTransactionId: sharedTransactionId })),
        repository.applyVerifiedOutcome(notification(second, 'succeeded', { providerTransactionId: sharedTransactionId }))
      ]);

      expect(results.sort()).toEqual(['applied', 'state_conflict']);
      const statuses = await Promise.all([repository.findById(first.id), repository.findById(second.id)]);
      expect(statuses.map((record) => record?.status).sort()).toEqual(['creating', 'succeeded']);
    });

    it('treats a stale pending callback after success as a harmless duplicate', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.record);
      await repository.applyVerifiedOutcome(notification(record));

      expect(await repository.applyVerifiedOutcome(notification(record, 'pending'))).toBe('duplicate');
      expect((await repository.findById(record.id))?.status).toBe('succeeded');
    });

    it('stores the checkout URL when pending IPN arrives before create returns', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.record);
      await repository.applyVerifiedOutcome(notification(record, 'pending'));

      const updated = await repository.attachCheckoutUrlIfAbsent(record.id, 'https://sandbox.example/checkout');

      expect(updated.status).toBe('pending');
      expect(updated.checkoutUrl).toBe('https://sandbox.example/checkout');
    });

    it('attaches the checkout URL without changing an early successful result', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.record);
      await repository.applyVerifiedOutcome(notification(record));

      const updated = await repository.attachCheckoutUrlIfAbsent(record.id, 'https://sandbox.example/checkout');

      expect(updated.status).toBe('succeeded');
      expect(updated.checkoutUrl).toBe('https://sandbox.example/checkout');
    });

    it('distinguishes missing orders, amount mismatch, and request reference mismatch', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.record);

      expect(await repository.applyVerifiedOutcome(notification(record, 'succeeded', { providerOrderId: 'missing' }))).toBe('not_found');
      expect(await repository.applyVerifiedOutcome(notification(record, 'succeeded', { amountVnd: 1 }))).toBe('amount_mismatch');
      expect(
        await repository.applyVerifiedOutcome(notification(record, 'succeeded', { providerRequestId: 'wrong-request' }))
      ).toBe('reference_mismatch');
      expect((await repository.findById(record.id))?.status).toBe('creating');
    });

    it('keeps provider transaction IDs as strings beyond SQL integer range', async () => {
      const record = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.record);

      expect(await repository.applyVerifiedOutcome(notification(record))).toBe('applied');
      expect((await repository.findById(record.id))?.providerTransactionId).toBe(
        `9007199254740993-${record.providerOrderId}`
      );
    });

    it('sets unknown and definitive creation failure only while the payment is creating', async () => {
      const uncertain = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.record);
      expect((await repository.setUnknownIfCreating(uncertain.id)).status).toBe('unknown');
      expect((await repository.setCreateFailedIfCreating(uncertain.id, 'merchant_rejected')).status).toBe('unknown');

      const rejected = await repository.insertOrFindByIdempotency(newPayment()).then((result) => result.record);
      expect((await repository.setCreateFailedIfCreating(rejected.id, 'merchant_rejected')).status).toBe('create_failed');
      expect((await repository.findById(rejected.id))?.providerResultCode).toBe('merchant_rejected');
    });

    it('allows the same provider order reference in separate provider namespaces', async () => {
      const vnpay = { ...newPayment('u_vnpay', 'vnpay'), providerOrderId: 'shared-order-id' };
      const momo = { ...newPayment('u_momo', 'momo'), providerOrderId: 'shared-order-id' };

      await repository.insertOrFindByIdempotency(vnpay);
      await repository.insertOrFindByIdempotency(momo);

      expect(await repository.findByProviderOrderId('vnpay', 'shared-order-id')).toMatchObject({ id: vnpay.id });
      expect(await repository.findByProviderOrderId('momo', 'shared-order-id')).toMatchObject({ id: momo.id });
    });
  });
}

if (mongoUri) {
  await runRepositoryContract('Mongo payment repository', async () => {
    const client = new MongoClient(mongoUri);
    await client.connect();
    const db = client.db(`payment_contract_${randomUUID().replaceAll('-', '')}`);
    await upMongoPaymentMigration({ context: db });
    return {
      repository: new MongoPaymentRepository(db),
      cleanup: async () => {
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
    return {
      repository: new PostgresPaymentRepository(pool),
      cleanup: async () => {
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
