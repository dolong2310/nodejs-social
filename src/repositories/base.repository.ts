/*
 * BaseRepository class for generic database operations
 * This class provides methods for checking existence, counting records,
 * and finding records with pagination.
 */

import DatabaseService from '@/database/mongodb/database.service';
import { Collection, CountDocumentsOptions, Document, Filter, Sort, WithId } from 'mongodb';

export abstract class BaseRepository {
  protected db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  // Generic method to check if a record exists
  protected async exists<T extends Document>(model: Collection<T>, filter: Filter<T>): Promise<boolean> {
    const count = await model.countDocuments(filter, { limit: 1 } as CountDocumentsOptions);
    return count > 0;
  }

  // Generic method to count records
  protected async count<T extends Document>(model: Collection<T>, filter?: Filter<T>): Promise<number> {
    return model.countDocuments(filter);
  }

  // Generic method to find many with pagination
  protected async findManyWithPagination<T extends Document>(
    model: Collection<T>,
    filter?: Filter<T>,
    orderBy?: Sort | string,
    pagination?: { page: number; limit: number } // PaginationParams
  ): Promise<WithId<T>[]> {
    const { page = 1, limit = 10 } = pagination ?? {};
    return await model
      .find(filter ?? {})
      .sort(orderBy ?? {})
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
  }
}
