import { UniqueEntityID } from '@/domain/entities/base/unique-id.entity';
import { PermissionEntity } from '@/domain/entities/permission/permission.entity';
import { Mapper } from '@/infrastructure/persistence/repositories/base/base.mapper';
import {
  PermissionModel,
  permissionSchema
} from '@/infrastructure/persistence/repositories/permission/permission.model';
import { parse } from 'valibot';

export class PermissionMapper implements Mapper<PermissionEntity, PermissionModel> {
  toPersistence(entity: PermissionEntity): PermissionModel {
    const clone = entity.getProps();
    const record: PermissionModel = {
      _id: clone.id.toString(),
      name: clone.name,
      description: clone.description,
      path: clone.path,
      method: clone.method,
      module: clone.module,
      createdAt: clone.createdAt,
      updatedAt: clone.updatedAt
    };
    return parse(permissionSchema, record);
  }
  toDomain(record: PermissionModel): PermissionEntity {
    const entity = new PermissionEntity({
      id: new UniqueEntityID(record._id),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
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
  toResponse() {}
}
