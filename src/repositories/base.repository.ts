/*
 * BaseRepository class for generic database operations
 * This class provides methods for checking existence, counting records,
 * and finding records with pagination.
 */

import DatabaseService from '@/database/database.service';
import { Collection, Document, Filter, WithId } from 'mongodb';

export abstract class BaseRepository {
  protected db: DatabaseService;

  constructor(db: DatabaseService) {
    this.db = db;
  }

  // Generic method to check if a record exists
  protected async exists<T extends Document>(model: Collection<T>, filter: Filter<T>): Promise<boolean> {
    const record = await model.findOne(filter);
    return record !== null;
  }

  // Generic method to count records
  protected async count<T extends Document>(model: Collection<T>, filter?: Filter<T>): Promise<number> {
    return await model.countDocuments(filter);
  }

  // Generic method to find many with pagination
  protected async findManyWithPagination<T extends Document>(
    model: Collection<T>,
    filter?: Filter<T>,
    orderBy?: any,
    pagination?: { page: number; limit: number } // PaginationParams
  ): Promise<WithId<T>[]> {
    const { page = 1, limit = 10 } = pagination ?? {};
    return await model
      .find(filter ?? {})
      .sort(orderBy)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();
  }
}
