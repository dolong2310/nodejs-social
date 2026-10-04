/**
 * Transaction boundary owned by the application layer.
 * Every repository call made inside `run` joins the same database transaction: it commits when `work`
 * resolves and rolls back when it throws. A nested `run` joins the outer transaction.
 *
 * Rules for `work`:
 * - Only database writes/reads that must be atomic. Keep side effects (cache invalidation, notifications,
 *   queues, HTTP calls) after `run` resolves; the adapter may retry `work` on transient conflicts.
 * - Await repository calls one by one instead of `Promise.all`; MongoDB does not support parallel
 *   operations inside one transaction.
 */
export interface UnitOfWorkPort {
  run<T>(work: () => Promise<T>): Promise<T>;
}
