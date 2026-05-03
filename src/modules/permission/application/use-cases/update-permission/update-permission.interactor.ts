import {
  PermissionNotFoundException,
  PermissionPathMethodConflictException
} from '@/modules/permission/application/permission.exception';
import { PermissionListItem } from '@/modules/permission/application/use-cases/list-permissions/list-permissions.in-port';
import {
  UpdatePermissionCommand,
  UpdatePermissionInPort
} from '@/modules/permission/application/use-cases/update-permission/update-permission.in-port';
import { PermissionFullProps } from '@/modules/permission/domain/entities/permission.type';
import { PermissionRepositoryPort } from '@/modules/permission/domain/repositories/permission.repository';
import { IUpdatePermissionInput } from '@/modules/permission/domain/repositories/permission.repository.type';

export class UpdatePermissionInteractor extends UpdatePermissionInPort {
  constructor(private readonly permissionRepository: PermissionRepositoryPort) {
    super();
  }

  async execute(command: UpdatePermissionCommand) {
    const currentEntity = await this.permissionRepository.findPermissionById(command.id);
    if (!currentEntity) {
      throw new PermissionNotFoundException();
    }
    const current = currentEntity.toObject<PermissionFullProps>();
    const nextPath = command.path ?? current.path;
    const nextMethod = command.method ?? current.method;

    if (nextPath !== current.path || nextMethod !== current.method) {
      const taken = await this.permissionRepository.findPermissionByPathAndMethod({
        path: nextPath,
        method: nextMethod,
        excludeId: command.id
      });
      if (taken) {
        throw new PermissionPathMethodConflictException();
      }
    }

    const patch: IUpdatePermissionInput = {};
    if (command.name !== undefined) patch.name = command.name;
    if (command.description !== undefined) patch.description = command.description;
    if (command.path !== undefined) patch.path = command.path;
    if (command.method !== undefined) patch.method = command.method;
    if (command.module !== undefined) patch.module = command.module;

    if (Object.keys(patch).length === 0) {
      return new PermissionListItem(currentEntity.toObject());
    }

    const updated = await this.permissionRepository.updatePermission(command.id, patch);
    if (!updated) {
      throw new PermissionNotFoundException();
    }
    return new PermissionListItem(updated.toObject());
  }
}
