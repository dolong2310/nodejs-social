import { RoleEntity } from '@/modules/authorization/domain/entities/role.entity';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import {
  CreateRoleInput,
  ListRolesInput,
  UpdateRoleInput
} from '@/modules/authorization/domain/repositories/role.repository.type';
import { RoleName } from '@/modules/authorization/domain/value-objects/role-name.value-object';
import { RoleMapper } from '@/modules/authorization/infrastructure/persistence/mongo/role.mapper';
import { RoleModel } from '@/modules/authorization/infrastructure/persistence/mongo/role.model';
import { convertObjectToSnakeCase } from '@/modules/common/utils/object-case.util';
import { LoggerPort } from '@/modules/core/application/ports/logger.port';
import { Options } from '@/modules/core/domain/repositories/port.repository';
import { MongoRepositoryBase } from '@/modules/core/infrastructure/persistence/repositories/base.mongo.repository';
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
    return this.findById(id);
  }

  async findRoleByName(name: string): Promise<RoleEntity | null> {
    const record = await this.dbCollection.findOne({ name: RoleName.create(name).value, deleted_at: null });
    return record ? this.mapper.toDomain(record) : null;
  }

  async findRoles({ limit, skip = 0 }: ListRolesInput): Promise<RoleEntity[]> {
    const records = await this.dbCollection
      .find({ deleted_at: null })
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .toArray();
    return records.map((item) => this.mapper.toDomain(item));
  }

  async countRoles(): Promise<number> {
    return this.count();
  }

  async createRole(data: CreateRoleInput): Promise<RoleEntity | null> {
    const entity = RoleEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    const result = await this.dbCollection.findOneAndUpdate(
      { name: record.name, description: record.description, is_active: record.is_active, deleted_at: null },
      { $setOnInsert: record },
      { upsert: true, returnDocument: 'after' }
    );
    return result ? this.mapper.toDomain(result) : null;
  }

  async insertRole(data: CreateRoleInput): Promise<RoleEntity> {
    const entity = RoleEntity.create(data);
    const record = this.mapper.toPersistence(entity);
    await this.dbCollection.insertOne(record);
    const doc = await this.dbCollection.findOne({ _id: record._id });
    if (!doc) {
      throw new Error('Failed to read role after insert');
    }
    return this.mapper.toDomain(doc);
  }

  async updateRole(id: string, data: UpdateRoleInput): Promise<RoleEntity | null> {
    const patch: UpdateRoleInput = {
      ...data
    };
    if (data.name !== undefined) patch.name = RoleName.create(data.name).value;
    const record = await this.dbCollection.findOneAndUpdate(
      { _id: id, deleted_at: null },
      { $set: { ...convertObjectToSnakeCase(patch, ['id', '_id'], '_id'), updated_at: new Date() } },
      { returnDocument: 'after' }
    );
    return record ? this.mapper.toDomain(record) : null;
  }

  async deleteRole(id: string, options?: Options): Promise<RoleEntity | null> {
    const current = await this.findRoleById(id);
    if (!current) return null;
    const deleted = await this.deleteById(id, options);
    return deleted ? current : null;
  }

  async countRolesWithPermissionId(permissionId: string): Promise<number> {
    return this.dbCollection.countDocuments({ permission_ids: permissionId, deleted_at: null });
  }
}
