import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { RoleEntity } from '@/modules/role/domain/entities/role.entity';
import { RoleModel, roleSchema } from '@/modules/role/infrastructure/mongo/role.model';
import { parse } from 'valibot';
import { RoleFullProps } from '@/modules/role/domain/entities/role.type';

export class RoleMapper implements Mapper<RoleEntity, RoleModel, RoleFullProps> {
  toPersistence(entity: RoleEntity): RoleModel {
    const clone = entity.getProps();
    const record: RoleModel = {
      _id: clone.id.toString(),
      name: clone.name,
      description: clone.description,
      is_active: clone.isActive,
      permission_ids: clone.permissionIds,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(roleSchema, record);
  }
  toDomain(record: RoleModel): RoleEntity {
    const entity = new RoleEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        name: record.name,
        description: record.description,
        isActive: record.is_active,
        permissionIds: record.permission_ids
      }
    });
    return entity;
  }
  toResponse(record: RoleModel): RoleFullProps {
    return {
      id: record._id,
      name: record.name,
      description: record.description,
      isActive: record.is_active,
      permissionIds: record.permission_ids,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
