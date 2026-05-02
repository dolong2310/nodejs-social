import { LoggerPort } from '@/modules/core/infrastructure/logger/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { PermissionEntity } from '@/modules/permission/domain/entities/permission.entity';
import { PermissionRepositoryPort } from '@/modules/permission/domain/repositories/permission.repository';
import {
  ICreatePermissionInput,
  IFindPermissionByPathAndMethodInput,
  IListPermissionsInput,
  IUpdatePermissionInput
} from '@/modules/permission/domain/repositories/permission.repository.type';
import { PermissionMapper } from '@/modules/permission/infrastructure/mappers/permission.mapper';
import { PermissionModel } from '@/modules/permission/domain/repositories/permission.model';
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

  async findPermissions({ limit, skip = 0 }: IListPermissionsInput): Promise<PermissionEntity[]> {
    const records = await this.dbCollection.find({}).sort({ path: 1, method: 1 }).skip(skip).limit(limit).toArray();
    return records.map((item) => this.mapper.toDomain(item));
  }

  async countPermissions(): Promise<number> {
    return this.dbCollection.countDocuments({});
  }

  async findPermissionById(id: string): Promise<PermissionEntity | null> {
    const record = await this.dbCollection.findOne({ _id: id });
    return record ? this.mapper.toDomain(record) : null;
  }

  async findPermissionByPathAndMethod({
    path,
    method,
    excludeId
  }: IFindPermissionByPathAndMethodInput): Promise<PermissionEntity | null> {
    const filter: Record<string, unknown> = { path, method };
    if (excludeId !== undefined) {
      filter._id = { $ne: excludeId };
    }
    const record = await this.dbCollection.findOne(filter);
    return record ? this.mapper.toDomain(record) : null;
  }

  async createPermissions(data: ICreatePermissionInput[]): Promise<PermissionEntity[]> {
    const entities = data.map((item) => PermissionEntity.create(item));
    const records = entities.map((item) => this.mapper.toPersistence(item));
    await this.dbCollection.insertMany(records);
    return records.map((item) => this.mapper.toDomain(item));
  }

  async createPermission(data: ICreatePermissionInput): Promise<PermissionEntity | null> {
    const entity = PermissionEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    await this.dbCollection.insertOne(record);
    return record ? this.mapper.toDomain(record) : null;
  }

  async updatePermission(id: string, data: IUpdatePermissionInput): Promise<PermissionEntity | null> {
    const record = await this.dbCollection.findOneAndUpdate({ _id: id }, { $set: data }, { returnDocument: 'after' });
    return record ? this.mapper.toDomain(record) : null;
  }

  async deletePermission(id: string): Promise<PermissionEntity | null> {
    const record = await this.dbCollection.findOneAndDelete({ _id: id });
    return record ? this.mapper.toDomain(record) : null;
  }

  async deletePermissions(ids: string[]): Promise<number> {
    const result = await this.dbCollection.deleteMany({
      _id: { $in: ids }
    });
    return result.deletedCount;
  }
}
