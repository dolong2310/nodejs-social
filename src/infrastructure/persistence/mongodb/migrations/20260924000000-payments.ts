import type { Db } from 'mongodb';

export async function up({ context: db }: { context: Db }): Promise<void> {
  const payments = db.collection('payments');
  await Promise.all([
    payments.createIndex(
      { user_id: 1, idempotency_key: 1 },
      { unique: true, name: 'payments_user_idempotency_unique' }
    ),
    payments.createIndex(
      { provider: 1, provider_order_id: 1 },
      { unique: true, name: 'payments_provider_order_unique' }
    ),
    payments.createIndex(
      { provider: 1, provider_transaction_id: 1 },
      {
        unique: true,
        name: 'payments_provider_transaction_unique',
        partialFilterExpression: { provider_transaction_id: { $type: 'string' } }
      }
    )
  ]);
}

export async function down({ context: db }: { context: Db }): Promise<void> {
  const exists = await db.listCollections({ name: 'payments' }, { nameOnly: true }).hasNext();
  if (exists) await db.collection('payments').drop();
}
