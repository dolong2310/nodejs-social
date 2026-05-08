import {
  PermissionInUseByRolesException,
  PermissionNotFoundException
} from '@/modules/authorization/application/exceptions/permission.exception';
import {
  DeletePermissionCommand,
  DeletePermissionPort
} from '@/modules/authorization/application/use-cases/delete-permission/delete-permission.port';
import { PermissionRepositoryPort } from '@/modules/authorization/domain/repositories/permission.repository';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';

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
