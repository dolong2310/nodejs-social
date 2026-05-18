import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { EnumDatabaseDriver, type DatabasePort } from '@/infrastructure/persistence/database.port';
import { MongoDatabase } from '@/infrastructure/persistence/mongodb/database';
import { PostgresDatabase } from '@/infrastructure/persistence/postgres/database';

export async function setupDatabase(): Promise<DatabasePort> {
  switch (dbConfig.driver) {
    case EnumDatabaseDriver.POSTGRES: {
      const database = new PostgresDatabase({
        uri: dbConfig.postgres.uri,
        readUris: dbConfig.postgres.readUris,
        ssl: dbConfig.postgres.ssl
      });

      await database.connect();
      return database;
    }
    case EnumDatabaseDriver.MONGO: {
      const database = new MongoDatabase({
        uri: dbConfig.mongodb.uri,
        readUri: dbConfig.mongodb.readUri,
        databaseName: dbConfig.mongodb.name
      });

      await database.connect();
      return database;
    }
    default:
      throw new Error(`Unsupported database driver: ${dbConfig.driver}`);
  }
}
