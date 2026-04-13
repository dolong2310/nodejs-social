import { APP_ERROR_MESSAGE } from '@/application/common/constants/message.constant';

import { DatabaseService } from '@/infrastructure/persistence/mongodb/database.service';

export class DatabaseInstance {
  private static instance: DatabaseService | null = null;

  static init(config: { uri: string; databaseName: string; chatDatabaseName: string }) {
    if (this.instance) return this.instance;
    this.instance = new DatabaseService(config);
    return this.instance;
  }

  static get() {
    if (!this.instance) {
      throw new Error(APP_ERROR_MESSAGE.DATABASE_INSTANCE_NOT_INITIALIZED);
    }
    return this.instance;
  }
}
