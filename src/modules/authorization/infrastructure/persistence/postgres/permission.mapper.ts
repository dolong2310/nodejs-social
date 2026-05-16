import { PermissionEntity } from '@/modules/authorization/domain/entities/permission.entity';
import { PermissionFullProps } from '@/modules/authorization/domain/entities/permission.type';
import { PermissionPath } from '@/modules/authorization/domain/value-objects/permission-path.value-object';
import {
  PermissionModel,
  permissionSchema
} from '@/modules/authorization/infrastructure/persistence/postgres/permission.model';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class PermissionMapper implements Mapper<PermissionEntity, PermissionModel, PermissionFullProps> {
  toPersistence(entity: PermissionEntity): PermissionModel {
    const clone = entity.getProps();
    const record: PermissionModel = {
      id: clone.id.toString(),
      name: clone.name,
      description: clone.description,
      path: clone.path.value,
      method: clone.method,
      module: clone.module,
      created_at: clone.createdAt,
      created_by_id: clone.createdById ?? null,
      updated_at: clone.updatedAt,
      updated_by_id: clone.updatedById ?? null,
      deleted_at: clone.deletedAt ?? null,
      deleted_by_id: clone.deletedById ?? null
    };
    return parse(permissionSchema, record);
  }
  toDomain(record: PermissionModel): PermissionEntity {
    const entity = new PermissionEntity({
      id: new UniqueEntityID(record.id),
      createdAt: record.created_at,
      createdById: record.created_by_id ?? null,
      updatedAt: record.updated_at,
      updatedById: record.updated_by_id ?? null,
      deletedAt: record.deleted_at ?? null,
      deletedById: record.deleted_by_id ?? null,
      props: {
        name: record.name,
        description: record.description,
        path: PermissionPath.create(record.path),
        method: record.method,
        module: record.module
      }
    });
    return entity;
  }
  toResponse(record: PermissionModel): PermissionFullProps {
    const response = {
      id: record.id,
      name: record.name,
      description: record.description,
      path: record.path,
      method: record.method,
      module: record.module,
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
