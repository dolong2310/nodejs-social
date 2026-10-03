import type { Pool } from 'pg';

export async function up({ context: pool }: { context: Pool }): Promise<void> {
  await pool.query(`
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_provider_check;
    ALTER TABLE payments
      ADD CONSTRAINT payments_provider_check CHECK (provider IN ('vnpay', 'momo', 'zalopay'));
  `);
}

export async function down({ context: pool }: { context: Pool }): Promise<void> {
  await pool.query(`
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_provider_check;
    ALTER TABLE payments
      ADD CONSTRAINT payments_provider_check CHECK (provider IN ('vnpay', 'momo'));
  `);
}
