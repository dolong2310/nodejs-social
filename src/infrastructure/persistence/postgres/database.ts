import logger from '@/infrastructure/logger/create-logger';
import type { DatabasePort } from '@/infrastructure/persistence/database.port';
import { Pool } from 'pg';

const log = logger.child({ module: 'postgres-database-service' });

export interface PostgresDatabasePort extends DatabasePort {
  pool: Pool;
  readPool: Pool;
  readPools: Pool[];
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export class PostgresDatabase implements PostgresDatabasePort {
  public pool: Pool;
  public readPool: Pool;
  public readPools: Pool[];
  private currentReadIndex = 0;

  constructor(readonly config: { uri: string; readUris: string[]; ssl?: boolean }) {
    const { uri, readUris, ssl } = config;

    this.pool = new Pool({
      connectionString: uri,
      ssl: ssl ? { rejectUnauthorized: false } : undefined
    });
    this.readPools = readUris.map(
      (uri) =>
        new Pool({
          connectionString: uri,
          ssl: ssl ? { rejectUnauthorized: false } : undefined
        })
    );
    this.readPool = this.readPools.length > 0 ? this.createReplicaPoolRouter() : this.pool;
  }

  private createReplicaPoolRouter(): Pool {
    const [basePool] = this.readPools;
    if (!basePool) return this.pool;

    // round robin algorithm to get the next replica pool
    // example: [pool1, pool2, pool3] -> pool1, pool2, pool3, pool1, pool2, pool3, ...
    const getNextReplicaPool = (): Pool => {
      if (this.readPools.length === 0) return this.pool;
      const pool = this.readPools[this.currentReadIndex % this.readPools.length] ?? this.pool;
      this.currentReadIndex = (this.currentReadIndex + 1) % this.readPools.length;
      return pool;
    };

    const query = ((...args: unknown[]) => {
      const pool = getNextReplicaPool();
      return Reflect.apply(pool.query, pool, args);
    }) as Pool['query'];

    // proxy to the base pool to get the next replica pool
    // example: basePool.query -> getNextReplicaPool().query
    return new Proxy(basePool, {
      get(target, property, receiver) {
        if (property === 'query') return query;

        const value = Reflect.get(target, property, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      }
    });
  }

  async connect(): Promise<void> {
    const handleConnect = async (pool: Pool, errorMessage?: string) => {
      const client = await pool.connect();
      try {
        await client.query('SELECT 1');
      } catch (error) {
        log.error({ err: error }, errorMessage ?? 'postgres:::error-connecting');
        await this.disconnect();
        throw error;
      } finally {
        client.release();
      }
    };

    await handleConnect(this.pool);

    await Promise.all(
      this.readPools.map(async (pool, index) => {
        await handleConnect(pool, `postgres:::error-connecting-to-replica-${index}`);
      })
    );

    log.info({ replicas: this.readPools.length }, 'postgres:::connected');
  }

  async disconnect(): Promise<void> {
    await Promise.all([this.pool.end(), ...this.readPools.map((pool) => pool.end())]);
  }
}
