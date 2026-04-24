import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { RoleEntity } from '@/domain/entities/role/role.entity';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import { RoleModel, roleSchema } from '@/infrastructure/persistence/repositories/role/role.model';
import { parse } from 'valibot';

export class RoleMapper implements Mapper<RoleEntity, RoleModel> {
  toPersistence(entity: RoleEntity): RoleModel {
    const clone = entity.getProps();
    const record: RoleModel = {
      _id: clone.id.toString(),
      name: clone.name,
      description: clone.description,
      isActive: clone.isActive,
      permissionIds: clone.permissionIds,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(roleSchema, record);
  }
  toDomain(record: RoleModel): RoleEntity {
    const entity = new RoleEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
      props: {
        name: record.name,
        description: record.description,
        isActive: record.isActive,
        permissionIds: record.permissionIds
      }
    });
    return entity;
  }
  toResponse() {}
}
