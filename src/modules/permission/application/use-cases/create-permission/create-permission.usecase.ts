import {
  FailedToCreatePermissionException,
  PermissionPathMethodConflictException
} from '@/modules/permission/application/permission.exception';
import {
  CreatePermissionCommand,
  CreatePermissionPort
} from '@/modules/permission/application/use-cases/create-permission/create-permission.port';
import { PermissionListItem } from '@/modules/permission/application/use-cases/list-permissions/list-permissions.port';
import { PermissionRepositoryPort } from '@/modules/permission/domain/repositories/permission.repository';

export class CreatePermissionUseCase extends CreatePermissionPort {
  constructor(private readonly permissionRepository: PermissionRepositoryPort) {
    super();
  }

  async execute(command: CreatePermissionCommand) {
    const existing = await this.permissionRepository.findPermissionByPathAndMethod({
      path: command.path,
      method: command.method
    });
    if (existing) {
      throw new PermissionPathMethodConflictException();
    }
    const entity = await this.permissionRepository.createPermission({
      name: command.name,
      description: command.description,
      path: command.path,
      method: command.method,
      module: command.module
    });
    if (!entity) {
      throw new FailedToCreatePermissionException();
    }
    return new PermissionListItem(entity.toObject());
  }
}
