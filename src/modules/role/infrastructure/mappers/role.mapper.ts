import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { RoleEntity } from '@/modules/role/domain/entities/role.entity';
import { RoleModel, roleSchema } from '@/modules/role/domain/repositories/role.model';
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
