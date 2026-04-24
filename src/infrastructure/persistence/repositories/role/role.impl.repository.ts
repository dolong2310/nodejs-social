import { LoggerPort } from '@/application/ports/logger.port';
import { RoleEntity } from '@/domain/entities/role/role.entity';
import { ERoleName } from '@/domain/entities/role/role.type';
import { RoleRepositoryPort } from '@/domain/repositories/role/role.repository';
import { ICreateRoleInput, IUpdateRoleInput } from '@/domain/repositories/role/role.repository.type';
import { MongoRepositoryBase } from '@/infrastructure/persistence/repositories/base/base.mongo.repository';
import { RoleMapper } from '@/infrastructure/persistence/repositories/role/role.mapper';
import { RoleModel } from '@/infrastructure/persistence/repositories/role/role.model';
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

  async findRoleByName(name: ERoleName): Promise<RoleEntity | null> {
    const record = await this.dbCollection.findOne({ name });
    return record ? this.mapper.toDomain(record) : null;
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
}
