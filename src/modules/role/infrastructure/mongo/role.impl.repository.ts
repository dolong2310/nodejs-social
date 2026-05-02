import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
import { RoleEntity } from '@/modules/role/domain/entities/role.entity';
import { RoleRepositoryPort } from '@/modules/role/domain/repositories/role.repository';
import { ICreateRoleInput, IListRolesInput, IUpdateRoleInput } from '@/modules/role/domain/repositories/role.repository.type';
import { RoleMapper } from '@/modules/role/infrastructure/mappers/role.mapper';
import { RoleModel } from '@/modules/role/infrastructure/mongo/role.model';
import { Db, MongoClient } from 'mongodb';

export class RoleRepository extends MongoRepositoryBase<RoleEntity, RoleModel> implements RoleRepositoryPort {
  protected collectionName = 'roles';

  constructor(
    protected readonly db: Db,
    protected readonly dbClient: MongoClient,
    protected readonly mapper: RoleMapper,
    protected readonly logger: LoggerPort
  ) {
    super(mapper, logger);
  }

  async findRoleById(id: string): Promise<RoleEntity | null> {
    const record = await this.dbCollection.findOne({ _id: id });
    return record ? this.mapper.toDomain(record) : null;
  }

  async findRoleByName(name: string): Promise<RoleEntity | null> {
    const record = await this.dbCollection.findOne({ name });
    return record ? this.mapper.toDomain(record) : null;
  }

  async findRoles({ limit, skip = 0 }: IListRolesInput): Promise<RoleEntity[]> {
    const records = await this.dbCollection.find({}).sort({ name: 1 }).skip(skip).limit(limit).toArray();
    return records.map((item) => this.mapper.toDomain(item));
  }

  async countRoles(): Promise<number> {
    return this.dbCollection.countDocuments({});
  }

  async createRole(data: ICreateRoleInput): Promise<RoleEntity | null> {
    const entity = RoleEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    const result = await this.dbCollection.findOneAndUpdate(
      { name: record.name, description: record.description, isActive: record.isActive },
      { $setOnInsert: record },
      { upsert: true, returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async insertRole(data: ICreateRoleInput): Promise<RoleEntity> {
    const entity = RoleEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    await this.dbCollection.insertOne(record);
    const doc = await this.dbCollection.findOne({ _id: record._id });
    if (!doc) {
      throw new Error('Failed to read role after insert');
    }
    return this.mapper.toDomain(doc);
  }

  async updateRole(id: string, data: IUpdateRoleInput): Promise<RoleEntity | null> {
    const record = await this.dbCollection.findOneAndUpdate({ _id: id }, { $set: data }, { returnDocument: 'after' });
    return record ? this.mapper.toDomain(record) : null;
  }

  async deleteRole(id: string): Promise<RoleEntity | null> {
    const record = await this.dbCollection.findOneAndDelete({
      _id: id
    });
    return record ? this.mapper.toDomain(record) : null;
  }

  async countRolesWithPermissionId(permissionId: string): Promise<number> {
    return this.dbCollection.countDocuments({ permissionIds: permissionId });
  }
}
