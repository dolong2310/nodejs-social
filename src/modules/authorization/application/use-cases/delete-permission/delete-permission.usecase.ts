import {
  PermissionInUseByRolesException,
  PermissionNotFoundException
} from '@/modules/authorization/application/exceptions/permission.exception';
import {
  type DeletePermissionInputPort,
  DeletePermissionPort
} from '@/modules/authorization/application/use-cases/delete-permission/delete-permission.port';
import type { PermissionRepositoryPort } from '@/modules/authorization/domain/repositories/permission.repository';
import type { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';

export class DeletePermissionUseCase extends DeletePermissionPort {
  constructor(
    private readonly permissionRepository: PermissionRepositoryPort,
    private readonly roleRepository: RoleRepositoryPort
  ) {
    super();
  }

  async execute(input: DeletePermissionInputPort): Promise<void> {
    const current = await this.permissionRepository.findPermissionById(input.id);
    if (!current) {
      throw new PermissionNotFoundException();
    }
    const inUse = await this.roleRepository.countRolesWithPermissionId(input.id);
    if (inUse > 0) {
      throw new PermissionInUseByRolesException();
    }
    const removed = await this.permissionRepository.deletePermission(input.id, { actorId: input.actorId });
    if (!removed) {
      throw new PermissionNotFoundException();
    }
  }
}
