import { convertObjectToSnakeCase } from '@/modules/common/utils/object-case.util';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { Entity as DomainEntity } from '@/modules/core/domain/entities/base.entity';
import {
  Options,
  Paginated,
  PaginatedQueryParams,
  RepositoryPort
} from '@/modules/core/domain/repositories/port.repository';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import type { ClientSession, Collection, Db, Filter, MongoClient, OptionalUnlessRequiredId } from 'mongodb';

export abstract class MongoRepositoryBase<
  Entity extends DomainEntity<unknown>,
  DbModel extends Record<string, unknown>
> implements RepositoryPort<Entity> {
  protected abstract collectionName: string;
  protected abstract readonly db: Db;
  protected abstract readonly dbClient: MongoClient;
  protected session?: ClientSession;

  protected get dbCollection(): Collection<DbModel> {
    return this.db.collection<DbModel>(this.collectionName);
  }

  protected constructor(
    protected readonly mapper: Mapper<Entity, DbModel>,
    protected readonly logger: LoggerPort
  ) {}

  // QUERY

  async findById(id: string, options?: Options): Promise<Entity | null> {
    const record = await this.dbCollection.findOne<DbModel>(this._withDeletedFilter(this._buildIdFilter(id), options), {
      session: this.session,
      projection: this._toDbProjection(options?.projection)
    });
    return record ? this.mapper.toDomain(record) : null;
  }

  async findOne(entity: Partial<Entity>, options?: Options): Promise<Entity | null> {
    const record = await this.dbCollection.findOne<DbModel>(
      this._withDeletedFilter(this._toDbFilter(entity), options),
      {
        session: this.session,
        projection: this._toDbProjection(options?.projection)
      }
    );
    return record ? this.mapper.toDomain(record) : null;
  }

  async find(entity: Partial<Entity>, options?: Options): Promise<Entity[]> {
    const records = await this.dbCollection
      .find<DbModel>(this._withDeletedFilter(this._toDbFilter(entity), options), {
        session: this.session,
        projection: this._toDbProjection(options?.projection)
      })
      .toArray();
    return records.map((record) => this.mapper.toDomain(record));
  }

  async findAll(options?: Options): Promise<Entity[]> {
    const records = await this.dbCollection
      .find<DbModel>(this._withDeletedFilter({} as Filter<DbModel>, options), {
        session: this.session,
        projection: this._toDbProjection(options?.projection)
      })
      .toArray();
    return records.map((record) => this.mapper.toDomain(record));
  }

  async findAllByIds(ids: string[], options?: Options): Promise<Entity[]> {
    if (ids.length === 0) return [];
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return [];
    const records = await this.dbCollection
      .find<DbModel>(this._withDeletedFilter({ _id: { $in: uniqueIds } } as Filter<DbModel>, options), {
        session: this.session,
        projection: this._toDbProjection(options?.projection)
      })
      .toArray();
    return records.map((record) => this.mapper.toDomain(record));
  }

  async findAllPaginated(params: PaginatedQueryParams, options?: Options): Promise<Paginated<Entity>> {
    const sortField = params.orderBy.field === true ? '_id' : this._toMongoFieldName(String(params.orderBy.field));
    const sortDirection = params.orderBy.param === 'asc' ? 1 : -1;
    const filter = this._withDeletedFilter({} as Filter<DbModel>, options);
    const [records, count] = await Promise.all([
      this.dbCollection
        .find<DbModel>(filter, { session: this.session, projection: this._toDbProjection(options?.projection) })
        .sort({ [sortField]: sortDirection } as Record<string, 1 | -1>)
        .skip(params.offset)
        .limit(params.limit)
        .toArray(),
      this.dbCollection.countDocuments(filter, { session: this.session })
    ]);
    return new Paginated<Entity>({
      count,
      limit: params.limit,
      page: params.page,
      data: records.map((record) => this.mapper.toDomain(record))
    });
  }

  async existsById(id: string, options?: Options): Promise<boolean> {
    const count = await this.dbCollection.countDocuments(this._withDeletedFilter(this._buildIdFilter(id), options), {
      limit: 1,
      session: this.session
    });
    return count > 0;
  }

  async count(entity?: Partial<Entity>, options?: Options): Promise<number> {
    return this.dbCollection.countDocuments(this._withDeletedFilter(this._toDbFilter(entity ?? {}), options), {
      session: this.session
    });
  }

  // INSERT

  async insert(entity: Entity, options?: Options): Promise<Entity> {
    const record = this._withAuditOnInsert(this.mapper.toPersistence(entity), options);
    await this.dbCollection.insertOne(record as OptionalUnlessRequiredId<DbModel>, {
      session: this.session
    });
    return this.mapper.toDomain(record);
  }

  async insertMany(entities: Entity[], options?: Options): Promise<Entity[]> {
    if (entities.length === 0) return [];
    const records = entities.map((e) => this._withAuditOnInsert(this.mapper.toPersistence(e), options));
    await this.dbCollection.insertMany(records as OptionalUnlessRequiredId<DbModel>[], {
      session: this.session
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  // UPDATE

  async update(id: string, entity: Partial<Entity>, options?: Options): Promise<Entity | null> {
    const updateData = this._toDbUpdate(entity);
    const updatedAt = new Date();
    const record = await this.dbCollection.findOneAndUpdate(
      this._withDeletedFilter(this._buildIdFilter(id), options),
      {
        $set: {
          ...updateData,
          updated_at: updatedAt,
          updated_by_id: options?.actorId ?? null
        }
      },
      {
        session: this.session,
        returnDocument: 'after',
        projection: this._toDbProjection(options?.projection)
      }
    );
    return record ? this.mapper.toDomain(record as DbModel) : null;
  }

  async updateOne(id: string, entity: Partial<Entity>, options?: Options): Promise<void> {
    const updateData = this._toDbUpdate(entity);
    const updatedAt = new Date();
    await this.dbCollection.updateOne(
      this._withDeletedFilter(this._buildIdFilter(id), options),
      {
        $set: {
          ...updateData,
          updated_at: updatedAt,
          updated_by_id: options?.actorId ?? null
        }
      },
      { session: this.session }
    );
  }

  async updateMany(entity: Partial<Entity>, data: Partial<Entity>, options?: Options): Promise<number> {
    const dbFilter = this._withDeletedFilter(this._toDbFilter(entity), options);
    const updateData = this._toDbUpdate(data);
    const updatedAt = new Date();
    const result = await this.dbCollection.updateMany(
      dbFilter,
      {
        $set: {
          ...updateData,
          updated_at: updatedAt,
          updated_by_id: options?.actorId ?? null
        }
      },
      { session: this.session }
    );
    return result.modifiedCount;
  }

  // DELETE

  async deleteById(id: string, options?: Options): Promise<boolean> {
    if (options?.hardDelete) {
      const result = await this.dbCollection.deleteOne(this._buildIdFilter(id), {
        session: this.session
      });
      return result.deletedCount > 0;
    }

    const deletedAt = new Date();
    const result = await this.dbCollection.updateOne(
      this._withDeletedFilter(this._buildIdFilter(id), options),
      {
        $set: {
          deleted_at: deletedAt,
          deleted_by_id: options?.actorId ?? null,
          updated_at: deletedAt,
          updated_by_id: options?.actorId ?? null
        } as unknown as Partial<DbModel>
      },
      { session: this.session }
    );
    return result.modifiedCount > 0;
  }

  async deleteAllByIds(ids: string[], options?: Options): Promise<boolean> {
    if (ids.length === 0) return false;
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return false;
    const idFilter = { _id: { $in: uniqueIds } } as Filter<DbModel>;
    if (options?.hardDelete) {
      const result = await this.dbCollection.deleteMany(idFilter, {
        session: this.session
      });
      return result.deletedCount > 0;
    }

    const deletedAt = new Date();
    const result = await this.dbCollection.updateMany(
      this._withDeletedFilter(idFilter, options),
      {
        $set: {
          deleted_at: deletedAt,
          deleted_by_id: options?.actorId ?? null,
          updated_at: deletedAt,
          updated_by_id: options?.actorId ?? null
        } as unknown as Partial<DbModel>
      },
      { session: this.session }
    );
    return result.modifiedCount > 0;
  }

  // TRANSACTION

  async transaction<T>(handler: () => Promise<T> | T): Promise<T> {
    const session = this.dbClient.startSession();
    try {
      let result!: T;
      await session.withTransaction(async () => {
        this.session = session;
        result = await handler();
      });

      return result;
    } finally {
      this.session = undefined;
      await session.endSession();
    }
  }

  // HELPERS

  protected _buildIdFilter(id: string): Filter<DbModel> {
    return { _id: id } as Filter<DbModel>;
  }

  protected _toDbFilter(filter: Partial<Entity>): Filter<DbModel> {
    const mapped = Object.entries(filter).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value === undefined) return acc;

      if (key === 'id') {
        acc['_id'] = value;
      } else {
        acc[this._toMongoFieldName(key)] = value;
      }

      return acc;
    }, {});

    return mapped as Filter<DbModel>;
  }

  protected _toDbUpdate(data: Partial<Entity>): Partial<DbModel> {
    const mapped = Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value === undefined) return acc;

      if (key === 'id') return acc; // omit id

      acc[this._toMongoFieldName(key)] = value;
      return acc;
    }, {});

    return mapped as Partial<DbModel>;
  }

  protected _toDbProjection(projection?: Record<string, unknown>): Record<string, unknown> | undefined {
    if (!projection) return undefined;
    return convertObjectToSnakeCase(projection, ['id', '_id'], '_id');
  }

  protected _withDeletedFilter(filter: Filter<DbModel>, options?: Options): Filter<DbModel> {
    if (options?.includeDeleted) return filter;
    const deletedFilter = options?.onlyDeleted ? { deleted_at: { $ne: null } } : { deleted_at: null };
    return { ...filter, ...deletedFilter } as Filter<DbModel>;
  }

  protected _withAuditOnInsert(record: DbModel, options?: Options): DbModel {
    const actorId = options?.actorId ?? null;
    return {
      ...record,
      created_by_id: (record.created_by_id as string | null | undefined) ?? actorId,
      updated_by_id: (record.updated_by_id as string | null | undefined) ?? actorId,
      deleted_by_id: (record.deleted_by_id as string | null | undefined) ?? null,
      deleted_at: (record.deleted_at as Date | null | undefined) ?? null
    };
  }

  protected _toMongoFieldName(field: string): string {
    if (field === 'id' || field === '_id') return '_id';
    const UPPERCASE_LETTER_REGEX = /[A-Z]/g; // Tìm tất cả ký tự viết hoa (A-Z) trong chuỗi
    return field.replace(UPPERCASE_LETTER_REGEX, (letter) => `_${letter.toLowerCase()}`);
  }

  // insertBulk(entity: Entity): Promise<void> {
  //   throw new Error('Method not implemented.');
  // }
  // insertBulkMany(entities: Entity[]): Promise<void> {
  //   throw new Error('Method not implemented.');
  // }
  // updateBulk(entity: Entity): Promise<void> | Promise<Entity> {
  //   throw new Error('Method not implemented.');
  // }
  // updateBulkMany(entities: Entity[]): Promise<void> | Promise<Entity[]> {
  //   throw new Error('Method not implemented.');
  // }
  // deleteBulk(entity: Entity): Promise<boolean> {
  //   throw new Error('Method not implemented.');
  // }
}
