import type { Pool } from 'pg';

export async function up({ context: pool }: { context: Pool }): Promise<void> {
  await pool.query(`
    ALTER TABLE payments
      ADD COLUMN created_by_id text NULL,
      ADD COLUMN updated_by_id text NULL,
      ADD COLUMN deleted_at timestamptz NULL,
      ADD COLUMN deleted_by_id text NULL;
  `);
}

export async function down({ context: pool }: { context: Pool }): Promise<void> {
  await pool.query(`
    ALTER TABLE payments
      DROP COLUMN deleted_by_id,
      DROP COLUMN deleted_at,
      DROP COLUMN updated_by_id,
      DROP COLUMN created_by_id;
  `);
}
