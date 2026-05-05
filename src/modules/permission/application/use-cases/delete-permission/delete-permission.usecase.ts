import {
  PermissionInUseByRolesException,
  PermissionNotFoundException
} from '@/modules/permission/application/permission.exception';
import {
  DeletePermissionCommand,
  DeletePermissionPort
} from '@/modules/permission/application/use-cases/delete-permission/delete-permission.port';
import { PermissionRepositoryPort } from '@/modules/permission/domain/repositories/permission.repository';
import { RoleRepositoryPort } from '@/modules/role/domain/repositories/role.repository';

export class DeletePermissionUseCase extends DeletePermissionPort {
  constructor(
    private readonly permissionRepository: PermissionRepositoryPort,
    private readonly roleRepository: RoleRepositoryPort
  ) {
    super();
  }

  async execute(command: DeletePermissionCommand): Promise<void> {
    const current = await this.permissionRepository.findPermissionById(command.id);
    if (!current) {
      throw new PermissionNotFoundException();
    }
    const inUse = await this.roleRepository.countRolesWithPermissionId(command.id);
    if (inUse > 0) {
      throw new PermissionInUseByRolesException();
    }
    const removed = await this.permissionRepository.deletePermission(command.id);
    if (!removed) {
      throw new PermissionNotFoundException();
    }
  }
}
