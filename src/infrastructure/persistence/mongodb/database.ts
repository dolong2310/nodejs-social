import logger from '@/infrastructure/logger/create-logger';
import type { DatabasePort } from '@/infrastructure/persistence/database.port';
import { Db, MongoClient } from 'mongodb';

const log = logger.child({ module: 'database-service' });

export interface MongoDatabasePort extends DatabasePort {
  dbClient: MongoClient;
  db: Db;
  readDbClient: MongoClient;
  readDb: Db;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
}

export class MongoDatabase implements MongoDatabasePort {
  public dbClient: MongoClient;
  public db: Db;
  public readDbClient: MongoClient;
  public readDb: Db;

  constructor(readonly config: { uri: string; readUri?: string; databaseName: string }) {
    this.dbClient = new MongoClient(config.uri, { readPreference: 'primary' });
    this.db = this.dbClient.db(config.databaseName);

    this.readDbClient = new MongoClient(config.readUri || config.uri, {
      readPreference: 'secondaryPreferred'
    });
    this.readDb = this.readDbClient.db(config.databaseName);
  }

  async connect() {
    try {
      await Promise.all([this.db.command({ ping: 1 }), this.readDb.command({ ping: 1 })]);
    } catch (error) {
      log.error({ err: error }, 'mongodb:::error-connecting');
      await this.disconnect();
      throw error;
    }
    log.info({ database: this.db.databaseName }, 'mongodb:::connected');
  }

  async disconnect() {
    await Promise.all([this.dbClient.close(), this.readDbClient.close()]);
  }
}
