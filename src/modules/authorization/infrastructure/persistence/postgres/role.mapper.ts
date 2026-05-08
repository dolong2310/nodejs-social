import { RoleEntity } from '@/modules/authorization/domain/entities/role.entity';
import { RoleFullProps } from '@/modules/authorization/domain/entities/role.type';
import { RoleModel, roleSchema } from '@/modules/authorization/infrastructure/persistence/postgres/role.model';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class RoleMapper implements Mapper<RoleEntity, RoleModel, RoleFullProps> {
  toPersistence(entity: RoleEntity): RoleModel {
    const clone = entity.getProps();
    const record: RoleModel = {
      id: clone.id.toString(),
      name: clone.name,
      description: clone.description,
      is_active: clone.isActive,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt,
      permission_ids: clone.permissionIds
    };
    return parse(roleSchema, record);
  }
  toDomain(record: RoleModel): RoleEntity {
    const entity = new RoleEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        name: record.name,
        description: record.description,
        isActive: record.is_active,
        permissionIds: record.permission_ids ?? []
      }
    });
    return entity;
  }
  toResponse(record: RoleModel): RoleFullProps {
    return {
      id: record.id,
      name: record.name,
      description: record.description,
      isActive: record.is_active,
      permissionIds: record.permission_ids ?? [],
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
