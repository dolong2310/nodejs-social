import {
  FailedToCreatePermissionException,
  PermissionPathMethodConflictException
} from '@/modules/authorization/application/exceptions/permission.exception';
import {
  type CreatePermissionInputPort,
  CreatePermissionPort
} from '@/modules/authorization/application/use-cases/create-permission/create-permission.port';
import { PermissionListItem } from '@/modules/authorization/application/use-cases/list-permissions/list-permissions.port';
import type { PermissionRepositoryPort } from '@/modules/authorization/domain/repositories/permission.repository';

export class CreatePermissionUseCase extends CreatePermissionPort {
  constructor(private readonly permissionRepository: PermissionRepositoryPort) {
    super();
  }

  async execute(input: CreatePermissionInputPort) {
    const existing = await this.permissionRepository.findPermissionByPathAndMethod({
      path: input.path,
      method: input.method
    });
    if (existing) {
      throw new PermissionPathMethodConflictException();
    }
    const entity = await this.permissionRepository.createPermission({
      name: input.name,
      description: input.description,
      path: input.path,
      method: input.method,
      module: input.module
    });
    if (!entity) {
      throw new FailedToCreatePermissionException();
    }
    return new PermissionListItem(entity.toObject());
  }
}
