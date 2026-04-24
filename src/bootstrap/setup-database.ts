import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { Database } from '@/infrastructure/persistence/mongodb/database';

export async function setupDatabase() {
  const database = new Database({
    uri: dbConfig.database.uri,
    databaseName: dbConfig.database.name
  });

  await database.connect();
  // await Promise.all([database.connect(), database.initializeIndexes(), database.initializeConversationIndexes()]);

  return database;
}
