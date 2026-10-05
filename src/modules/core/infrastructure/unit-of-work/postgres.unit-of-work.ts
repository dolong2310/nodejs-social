import type { UnitOfWorkPort } from '@/modules/core/application/ports/unit-of-work.port';
import { AsyncLocalStorage } from 'node:async_hooks';
import type { Pool, PoolClient } from 'pg';

type PostgresTransactionContext = { pool: Pool; client: PoolClient };

export type PostgresQueryable = Pick<Pool, 'query'> | Pick<PoolClient, 'query'>;

// Repositories are singletons, so the transaction connection is scoped to the async call chain of `run`.
const transactionStorage = new AsyncLocalStorage<PostgresTransactionContext>();

/**
 * Returns the connection of the transaction opened by `PostgresUnitOfWork.run` for this pool, or the pool
 * itself outside a transaction. Queries on another pool (e.g. the read replica) never join the transaction.
 */
export function getPostgresQueryable(pool: Pool): PostgresQueryable {
  const context = transactionStorage.getStore();
  return context?.pool === pool ? context.client : pool;
}

export class PostgresUnitOfWork implements UnitOfWorkPort {
  constructor(private readonly pool: Pool) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    // Join the outer transaction when nested.
    if (transactionStorage.getStore()?.pool === this.pool) {
      return work();
    }

    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await transactionStorage.run({ pool: this.pool, client }, work);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
