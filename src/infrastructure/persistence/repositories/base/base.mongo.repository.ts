import { LoggerPort } from '@/application/ports/logger.port';
import { Entity as DomainEntity } from '@/domain/entities/base/base.entity';
import { Options, Paginated, PaginatedQueryParams, RepositoryPort } from '@/domain/repositories/base/port.repository';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
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
    const record = await this.dbCollection.findOne<DbModel>(this._buildIdFilter(id), {
      session: this.session,
      projection: options?.projection
    });
    return record ? this.mapper.toDomain(record) : null;
  }

  async findOne(entity: Partial<Entity>, options?: Options): Promise<Entity | null> {
    const record = await this.dbCollection.findOne<DbModel>(this._toDbFilter(entity), {
      session: this.session,
      projection: options?.projection
    });
    return record ? this.mapper.toDomain(record) : null;
  }

  async find(entity: Partial<Entity>, options?: Options): Promise<Entity[]> {
    const records = await this.dbCollection
      .find<DbModel>(this._toDbFilter(entity), { session: this.session, projection: options?.projection })
      .toArray();
    return records.map((record) => this.mapper.toDomain(record));
  }

  async findAll(options?: Options): Promise<Entity[]> {
    const records = await this.dbCollection
      .find<DbModel>({}, { session: this.session, projection: options?.projection })
      .toArray();
    return records.map((record) => this.mapper.toDomain(record));
  }

  async findAllByIds(ids: string[], options?: Options): Promise<Entity[]> {
    if (ids.length === 0) return [];
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return [];
    const records = await this.dbCollection
      .find<DbModel>({ _id: { $in: uniqueIds } } as Filter<DbModel>, {
        session: this.session,
        projection: options?.projection
      })
      .toArray();
    return records.map((record) => this.mapper.toDomain(record));
  }

  async findAllPaginated(params: PaginatedQueryParams, options?: Options): Promise<Paginated<Entity>> {
    const sortField = params.orderBy.field === true ? '_id' : params.orderBy.field;
    const sortDirection = params.orderBy.param === 'asc' ? 1 : -1;
    const [records, count] = await Promise.all([
      this.dbCollection
        .find<DbModel>({}, { session: this.session, projection: options?.projection })
        .sort({ [sortField]: sortDirection } as Record<string, 1 | -1>)
        .skip(params.offset)
        .limit(params.limit)
        .toArray(),
      this.dbCollection.countDocuments({}, { session: this.session })
    ]);
    return new Paginated<Entity>({
      count,
      limit: params.limit,
      page: params.page,
      data: records.map((record) => this.mapper.toDomain(record))
    });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.dbCollection.countDocuments(this._buildIdFilter(id), {
      limit: 1,
      session: this.session
    });
    return count > 0;
  }

  async count(entity?: Partial<Entity>): Promise<number> {
    return this.dbCollection.countDocuments(this._toDbFilter(entity ?? {}), { session: this.session });
  }

  // INSERT

  async insert(entity: Entity): Promise<Entity> {
    const record = this.mapper.toPersistence(entity);
    await this.dbCollection.insertOne(record as OptionalUnlessRequiredId<DbModel>, {
      session: this.session
    });
    return this.mapper.toDomain(record);
  }

  async insertMany(entities: Entity[]): Promise<Entity[]> {
    if (entities.length === 0) return [];
    const records = entities.map((e) => this.mapper.toPersistence(e));
    await this.dbCollection.insertMany(records as OptionalUnlessRequiredId<DbModel>[], {
      session: this.session
    });
    return records.map((record) => this.mapper.toDomain(record));
  }

  // UPDATE

  async update(id: string, entity: Partial<Entity>, options?: Options): Promise<Entity | null> {
    const updateData = this._toDbUpdate(entity);
    const record = await this.dbCollection.findOneAndUpdate(
      this._buildIdFilter(id),
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      {
        session: this.session,
        returnDocument: 'after',
        projection: options?.projection
      }
    );
    return record ? this.mapper.toDomain(record as DbModel) : null;
  }

  async updateOne(id: string, entity: Partial<Entity>): Promise<void> {
    const updateData = this._toDbUpdate(entity);
    await this.dbCollection.updateOne(
      this._buildIdFilter(id),
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { session: this.session }
    );
  }

  async updateMany(entity: Partial<Entity>, data: Partial<Entity>): Promise<number> {
    const dbFilter = this._toDbFilter(entity);
    const updateData = this._toDbUpdate(data);
    const result = await this.dbCollection.updateMany(
      dbFilter,
      {
        $set: {
          ...updateData,
          updatedAt: new Date()
        }
      },
      { session: this.session }
    );
    return result.modifiedCount;
  }

  // DELETE

  async deleteById(id: string): Promise<boolean> {
    const result = await this.dbCollection.deleteOne(this._buildIdFilter(id), {
      session: this.session
    });
    return result.deletedCount > 0;
  }

  async deleteAllByIds(ids: string[]): Promise<boolean> {
    if (ids.length === 0) return false;
    const uniqueIds = [...new Set(ids)];
    if (uniqueIds.length === 0) return false;
    const result = await this.dbCollection.deleteMany({ _id: { $in: uniqueIds } } as Filter<DbModel>, {
      session: this.session
    });
    return result.deletedCount > 0;
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
        acc[key] = value;
      }

      return acc;
    }, {});

    return mapped as Filter<DbModel>;
  }

  protected _toDbUpdate(data: Partial<Entity>): Partial<DbModel> {
    const mapped = Object.entries(data).reduce<Record<string, unknown>>((acc, [key, value]) => {
      if (value === undefined) return acc;

      if (key === 'id') return acc; // omit id

      acc[key] = value;
      return acc;
    }, {});

    return mapped as Partial<DbModel>;
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
