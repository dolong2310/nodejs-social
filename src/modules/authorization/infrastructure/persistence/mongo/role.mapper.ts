import { RoleEntity } from '@/modules/authorization/domain/entities/role.entity';
import { RoleFullProps } from '@/modules/authorization/domain/entities/role.type';
import { RoleName } from '@/modules/authorization/domain/value-objects/role-name.value-object';
import { RoleModel, roleSchema } from '@/modules/authorization/infrastructure/persistence/mongo/role.model';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class RoleMapper implements Mapper<RoleEntity, RoleModel, RoleFullProps> {
  toPersistence(entity: RoleEntity): RoleModel {
    const clone = entity.getProps();
    const record: RoleModel = {
      _id: clone.id.toString(),
      name: clone.name.value,
      description: clone.description,
      is_active: clone.isActive,
      permission_ids: clone.permissionIds,
      created_at: clone.createdAt,
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };
    return parse(roleSchema, record);
  }
  toDomain(record: RoleModel): RoleEntity {
    const entity = new RoleEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
      props: {
        name: RoleName.create(record.name),
        description: record.description,
        isActive: record.is_active,
        permissionIds: record.permission_ids
      }
    });
    return entity;
  }
  toResponse(record: RoleModel): RoleFullProps {
    const response = {
      id: record._id,
      name: record.name,
      description: record.description,
      isActive: record.is_active,
      permissionIds: record.permission_ids,
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null
    };
    return response;
  }
}
