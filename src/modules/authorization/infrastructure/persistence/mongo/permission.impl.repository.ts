import { PermissionEntity } from '@/modules/authorization/domain/entities/permission.entity';
import { PermissionRepositoryPort } from '@/modules/authorization/domain/repositories/permission.repository';
import {
  CreatePermissionInput,
  FindPermissionByPathAndMethodInput,
  ListPermissionsInput,
  UpdatePermissionInput
} from '@/modules/authorization/domain/repositories/permission.repository.type';
import { PermissionPath } from '@/modules/authorization/domain/value-objects/permission-path.value-object';
import { PermissionMapper } from '@/modules/authorization/infrastructure/persistence/mongo/permission.mapper';
import { PermissionModel } from '@/modules/authorization/infrastructure/persistence/mongo/permission.model';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { Options } from '@/modules/core/domain/repositories/port.repository';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { Db, MongoClient } from 'mongodb';

export class PermissionRepository
  extends MongoRepositoryBase<PermissionEntity, PermissionModel>
  implements PermissionRepositoryPort
{
  protected collectionName = 'permissions';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: PermissionMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async findPermissions({ limit, skip = 0 }: ListPermissionsInput): Promise<PermissionEntity[]> {
    const records = await this.dbCollection
      .find({ deleted_at: null })
      .sort({ path: 1, method: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    return records.map((item) => this.mapper.toDomain(item));
  }

  async countPermissions(): Promise<number> {
    return this.count();
  }

  async findPermissionById(id: string): Promise<PermissionEntity | null> {
    return this.findById(id);
  }

  async findPermissionByPathAndMethod({
    path,
    method,
    excludeId
  }: FindPermissionByPathAndMethodInput): Promise<PermissionEntity | null> {
    const filter: Record<string, unknown> = { path: PermissionPath.create(path).value, method, deleted_at: null };
    if (excludeId) {
      filter._id = { $ne: excludeId };
    }
    const record = await this.dbCollection.findOne(filter);
    return record ? this.mapper.toDomain(record) : null;
  }

  async createPermissions(data: CreatePermissionInput[]): Promise<PermissionEntity[]> {
    const entities = data.map((item) => PermissionEntity.create(item));
    const records = entities.map((item) => this.mapper.toPersistence(item));
    await this.dbCollection.insertMany(records);
    return records.map((item) => this.mapper.toDomain(item));
  }

  async createPermission(data: CreatePermissionInput): Promise<PermissionEntity | null> {
    const entity = PermissionEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    await this.dbCollection.insertOne(record);
    return record ? this.mapper.toDomain(record) : null;
  }

  async updatePermission(id: string, data: UpdatePermissionInput): Promise<PermissionEntity | null> {
    const patch: UpdatePermissionInput = { ...data };
    if (data.path) patch.path = PermissionPath.create(data.path).value;
    const record = await this.dbCollection.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { $set: { ...patch, updated_at: new Date() } },
      { returnDocument: 'after' }
    );
    return record ? this.mapper.toDomain(record) : null;
  }

  async deletePermission(id: string, options?: Options): Promise<PermissionEntity | null> {
    const current = await this.findPermissionById(id);
    if (!current) return null;
    const deleted = await this.deleteById(id, options);
    return deleted ? current : null;
  }

  async deletePermissions(ids: string[]): Promise<number> {
    const result = await this.dbCollection.deleteMany({
      _id: { $in: ids }
    });
    return result.deletedCount;
  }
}
