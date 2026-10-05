import type { UnitOfWorkPort } from '@/modules/core/application/ports/unit-of-work.port';
import type { ClientSession, Collection, Document, MongoClient } from 'mongodb';
import { AsyncLocalStorage } from 'node:async_hooks';

type MongoTransactionContext = { client: MongoClient; session: ClientSession };

// Repositories are singletons, so the transaction session is scoped to the async call chain of `run`.
const transactionStorage = new AsyncLocalStorage<MongoTransactionContext>();

/**
 * Index of the `options` argument for each Collection method, so the active session can be injected.
 * Arguments before it may be omitted by callers; the driver defaults `undefined` filters to `{}`.
 */
const OPTIONS_ARGUMENT_INDEX: Readonly<Record<string, number>> = {
  insertOne: 1,
  insertMany: 1,
  bulkWrite: 1,
  updateOne: 2,
  updateMany: 2,
  replaceOne: 2,
  deleteOne: 1,
  deleteMany: 1,
  find: 1,
  findOne: 1,
  findOneAndUpdate: 2,
  findOneAndReplace: 2,
  findOneAndDelete: 1,
  aggregate: 1,
  countDocuments: 1,
  distinct: 2
};

/** Returns the session of the transaction opened by `MongoUnitOfWork.run` for this client, if any. */
export function getMongoTransactionSession(client: MongoClient): ClientSession | undefined {
  const context = transactionStorage.getStore();
  return context?.client === client ? context.session : undefined;
}

/**
 * Wraps a collection so every call made inside `MongoUnitOfWork.run` automatically carries the transaction
 * session. Without it, any query that forgets `{ session }` silently runs outside the transaction.
 * Calls outside a transaction, or on a collection of another client (e.g. the read replica), are untouched.
 */
export function bindTransactionSession<TSchema extends Document>(collection: Collection<TSchema>): Collection<TSchema> {
  return new Proxy(collection, {
    get(target, property) {
      const value: unknown = Reflect.get(target, property, target);
      const optionsIndex = typeof property === 'string' ? OPTIONS_ARGUMENT_INDEX[property] : undefined;
      if (optionsIndex === undefined || typeof value !== 'function') return value;

      return (...args: unknown[]) => {
        const session = getMongoTransactionSession(target.db.client);
        if (session) {
          const options = (args[optionsIndex] ?? {}) as { session?: ClientSession };
          args[optionsIndex] = options.session ? options : { ...options, session };
        }
        return (value as (...callArgs: unknown[]) => unknown).apply(target, args);
      };
    }
  });
}

/** Requires a replica set: MongoDB only supports transactions on replica set members or mongos. */
export class MongoUnitOfWork implements UnitOfWorkPort {
  constructor(private readonly client: MongoClient) {}

  async run<T>(work: () => Promise<T>): Promise<T> {
    // Join the outer transaction when nested.
    if (getMongoTransactionSession(this.client)) {
      return work();
    }

    const session = this.client.startSession();
    try {
      // withTransaction retries `work` on transient errors such as write conflicts.
      return await session.withTransaction(() => transactionStorage.run({ client: this.client, session }, work));
    } finally {
      await session.endSession();
    }
  }
}
