import {
  PermissionNotFoundException,
  PermissionPathMethodConflictException
} from '@/modules/authorization/application/exceptions/permission.exception';
import { PermissionListItem } from '@/modules/authorization/application/use-cases/list-permissions/list-permissions.port';
import {
  UpdatePermissionInputPort,
  UpdatePermissionPort
} from '@/modules/authorization/application/use-cases/update-permission/update-permission.port';
import { PermissionFullProps } from '@/modules/authorization/domain/entities/permission.types';
import { PermissionRepositoryPort } from '@/modules/authorization/domain/repositories/permission.repository';
import { UpdatePermissionInput } from '@/modules/authorization/domain/repositories/permission.repository.types';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';

export class UpdatePermissionUseCase extends UpdatePermissionPort {
  constructor(
    private readonly permissionRepository: PermissionRepositoryPort,
    private readonly cache: CacheManagerPort
  ) {
    super();
  }

  async execute(input: UpdatePermissionInputPort) {
    const currentEntity = await this.permissionRepository.findPermissionById(input.id);
    if (!currentEntity) {
      throw new PermissionNotFoundException();
    }
    const current = currentEntity.toObject<PermissionFullProps>();
    const nextPath = input.path ?? current.path;
    const nextMethod = input.method ?? current.method;

    if (nextPath !== current.path || nextMethod !== current.method) {
      const existing = await this.permissionRepository.findPermissionByPathAndMethod({
        path: nextPath,
        method: nextMethod,
        excludeId: input.id
      });
      if (existing) {
        throw new PermissionPathMethodConflictException();
      }
    }

    const patch: UpdatePermissionInput = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.path !== undefined) patch.path = input.path;
    if (input.method !== undefined) patch.method = input.method;
    if (input.module !== undefined) patch.module = input.module;

    if (Object.keys(patch).length === 0) {
      return new PermissionListItem(currentEntity.toObject());
    }

    const updated = await this.permissionRepository.updatePermission(input.id, patch);
    if (!updated) {
      throw new PermissionNotFoundException();
    }

    // await this.cache.invalidate(`role:${role.id}`);

    return new PermissionListItem(updated.toObject());
  }
}
