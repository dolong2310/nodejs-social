import { PermissionEntity } from '@/modules/authorization/domain/entities/permission.entity';
import { PermissionFullProps } from '@/modules/authorization/domain/entities/permission.type';
import {
  PermissionModel,
  permissionSchema
} from '@/modules/authorization/infrastructure/persistence/mongo/permission.model';
import { UniqueEntityID } from '@/modules/core/domain/entities/unique-id.entity';
import { Mapper } from '@/modules/core/infrastructure/base.mapper';
import { parse } from 'valibot';

export class PermissionMapper implements Mapper<PermissionEntity, PermissionModel, PermissionFullProps> {
  toPersistence(entity: PermissionEntity): PermissionModel {
    const clone = entity.getProps();
    const record: PermissionModel = {
      _id: clone.id.toString(),
      name: clone.name,
      description: clone.description,
      path: clone.path,
      method: clone.method,
      module: clone.module,
      created_at: clone.createdAt,
      updated_at: clone.updatedAt
    };
    return parse(permissionSchema, record);
  }
  toDomain(record: PermissionModel): PermissionEntity {
    const entity = new PermissionEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.created_at,
      updatedAt: record.updated_at,
      props: {
        name: record.name,
        description: record.description,
        path: record.path,
        method: record.method,
        module: record.module
      }
    });
    return entity;
  }
  toResponse(record: PermissionModel): PermissionFullProps {
    return {
      id: record._id,
      name: record.name,
      description: record.description,
      path: record.path,
      method: record.method,
      module: record.module,
      createdAt: record.created_at,
      updatedAt: record.updated_at
    };
  }
}
