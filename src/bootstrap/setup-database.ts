import { dbConfig } from '@/infrastructure/persistence/configurations/database.config';
import { DatabaseInstance } from '@/infrastructure/persistence/mongodb/database.instance';

export async function setupDatabase() {
  const database = DatabaseInstance.init({
    uri: dbConfig.database.uri,
    databaseName: dbConfig.database.name,
    chatDatabaseName: dbConfig.database.chatDatabaseName
  });

  await Promise.all([database.connect(), database.initializeIndexes(), database.initializeConversationIndexes()]);

  return database;
}
