import type { Pool } from 'pg';

const paymentsSchema = String.raw`
  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type = 'example'),
    source_reference TEXT NOT NULL CHECK (length(source_reference) > 0),
    description TEXT NOT NULL CHECK (length(description) > 0),
    amount_vnd INTEGER NOT NULL CHECK (amount_vnd > 0),
    currency TEXT NOT NULL CHECK (currency = 'VND'),
    provider TEXT NOT NULL CHECK (provider IN ('vnpay', 'momo')),
    provider_order_id TEXT NOT NULL,
    provider_request_id TEXT NOT NULL,
    idempotency_key TEXT NOT NULL,
    request_fingerprint TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('creating', 'pending', 'unknown', 'create_failed', 'succeeded', 'failed', 'cancelled')),
    checkout_url TEXT,
    expires_at TIMESTAMPTZ,
    provider_transaction_id TEXT,
    provider_result_code TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    version INTEGER NOT NULL DEFAULT 0 CHECK (version >= 0),
    CONSTRAINT payments_user_idempotency_unique UNIQUE (user_id, idempotency_key),
    CONSTRAINT payments_provider_order_unique UNIQUE (provider, provider_order_id)
  );

  CREATE UNIQUE INDEX IF NOT EXISTS payments_provider_transaction_unique
    ON payments (provider, provider_transaction_id)
    WHERE provider_transaction_id IS NOT NULL AND provider_transaction_id <> '' AND provider_transaction_id <> '0';
`;

export async function up({ context: pool }: { context: Pool }): Promise<void> {
  await pool.query(paymentsSchema);
}

export async function down({ context: pool }: { context: Pool }): Promise<void> {
  await pool.query('DROP TABLE IF EXISTS payments');
}
