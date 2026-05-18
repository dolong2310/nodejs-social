import type { Pool } from 'pg';
import type { MigrationParams, UmzugStorage } from 'umzug';

export class PostgresMigrationStorage implements UmzugStorage<Pool> {
  constructor(private readonly pool: Pool) {}

  private async ensureTable(): Promise<void> {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  async logMigration({ name }: MigrationParams<Pool>): Promise<void> {
    await this.ensureTable();
    await this.pool.query(
      `
        INSERT INTO schema_migrations (name)
        VALUES ($1)
        ON CONFLICT (name) DO NOTHING;
      `,
      [name]
    );
  }

  async unlogMigration({ name }: MigrationParams<Pool>): Promise<void> {
    await this.ensureTable();
    await this.pool.query('DELETE FROM schema_migrations WHERE name = $1;', [name]);
  }

  async executed(): Promise<string[]> {
    await this.ensureTable();
    const result = await this.pool.query<{ name: string }>('SELECT name FROM schema_migrations ORDER BY name ASC;');
    return result.rows.map((row) => row.name);
  }
}
