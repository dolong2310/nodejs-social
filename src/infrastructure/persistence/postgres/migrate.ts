import logger from '@/infrastructure/logger/create-logger';
import { runMigrationCli } from '@/infrastructure/persistence/migration-cli';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { PostgresDatabase } from '@/infrastructure/persistence/postgres/database';
import { PostgresMigrationStorage } from '@/infrastructure/persistence/postgres/migration-storage';
import { fileURLToPath } from 'node:url';
import { Umzug } from 'umzug';

const log = logger.child({ module: 'postgres-migrations' });

const database = new PostgresDatabase({
  uri: dbConfig.postgres.uri,
  readUris: [],
  ssl: dbConfig.postgres.ssl
});

await database.connect();

export const migrator = new Umzug({
  migrations: {
    glob: fileURLToPath(new URL('./migrations/*.{js,ts}', import.meta.url))
  },
  context: database.pool,
  storage: new PostgresMigrationStorage(database.pool),
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
