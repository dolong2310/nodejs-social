import logger from '@/infrastructure/logger/create-logger';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { runMigrationCli } from '@/infrastructure/persistence/migration-cli';
import { MongoDatabase } from '@/infrastructure/persistence/mongodb/database';
import { fileURLToPath } from 'node:url';
import { MongoDBStorage, Umzug } from 'umzug';

const log = logger.child({ module: 'mongodb-migrations' });

const database = new MongoDatabase({
  uri: dbConfig.mongodb.uri,
  readUri: dbConfig.mongodb.uri,
  databaseName: dbConfig.mongodb.name
});

await database.connect();

export const migrator = new Umzug({
  migrations: {
    glob: fileURLToPath(new URL('./migrations/*.{js,ts}', import.meta.url))
  },
  context: database.db,
  storage: new MongoDBStorage({ collection: database.db.collection('schema_migrations') }),
  logger: {
    info: (message) => log.info(message),
    warn: (message) => log.warn(message),
    error: (message) => log.error(message),
    debug: (message) => log.debug(message)
  },
  create: {
    folder: fileURLToPath(new URL('./migrations', import.meta.url))
  }
});

await runMigrationCli(migrator, database);
