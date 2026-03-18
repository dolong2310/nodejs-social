import DatabaseService from '@/services/database.service';

export class DatabaseSingleton {
  private static databaseService: DatabaseService | null = null;

  static init(config: { uri: string; databaseName: string }) {
    if (this.databaseService) return this.databaseService;
    this.databaseService = new DatabaseService(config);
    return this.databaseService;
  }

  static get() {
    if (!this.databaseService) {
      throw new Error('DatabaseService has not been initialized. Call DatabaseSingleton.init() during bootstrap.');
    }
    return this.databaseService;
  }
}
