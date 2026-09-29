import type { Pool } from 'pg';

export async function up({ context: pool }: { context: Pool }): Promise<void> {
  await pool.query(`
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_source_type_check;
    UPDATE payments SET source_type = 'order' WHERE source_type = 'example';
    ALTER TABLE payments
      ADD CONSTRAINT payments_source_type_check CHECK (source_type = 'order');
  `);
}

export async function down({ context: pool }: { context: Pool }): Promise<void> {
  await pool.query(`
    ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_source_type_check;
    UPDATE payments SET source_type = 'example' WHERE source_type = 'order';
    ALTER TABLE payments
      ADD CONSTRAINT payments_source_type_check CHECK (source_type = 'example');
  `);
}
