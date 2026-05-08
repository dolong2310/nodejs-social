import {
  CannotDeactivateAdminRoleException,
  CannotRenameSystemRoleException,
  RoleNameAlreadyExistsException,
  RoleNotFoundException
} from '@/modules/authorization/application/exceptions/role.exception';
import { RoleListItem } from '@/modules/authorization/application/use-cases/list-roles/list-roles.port';
import {
  UpdateRoleCommand,
  UpdateRolePort
} from '@/modules/authorization/application/use-cases/update-role/update-role.port';
import { ERoleName } from '@/modules/authorization/domain/entities/role.type';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import { IUpdateRoleInput } from '@/modules/authorization/domain/repositories/role.repository.type';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';

export class UpdateRoleUseCase extends UpdateRolePort {
  constructor(
    private readonly roleRepository: RoleRepositoryPort,
    private readonly cacheManager: CacheManagerPort
  ) {
    super();
  }

  async execute(command: UpdateRoleCommand) {
    const currentRole = await this.roleRepository.findRoleById(command.id);
    if (!currentRole) {
      throw new RoleNotFoundException();
    }
    const currentName = currentRole.getProps().name;

    if (command.name !== undefined && command.name !== currentName) {
      if (currentRole.isSystemRole()) {
        throw new CannotRenameSystemRoleException();
      }
      const existingRole = await this.roleRepository.findRoleByName(command.name);
      if (existingRole) {
        throw new RoleNameAlreadyExistsException();
      }
    }

    // Không được deactive role admin
    if (currentName === ERoleName.ADMIN && !command.isActive) {
      throw new CannotDeactivateAdminRoleException();
    }

    const patch: IUpdateRoleInput = {};
    if (command.name !== undefined) patch.name = command.name;
    if (command.description !== undefined) patch.description = command.description;
    if (command.isActive !== undefined) patch.isActive = command.isActive;
    if (command.permissionIds !== undefined) patch.permissionIds = command.permissionIds;

    if (Object.keys(patch).length === 0) {
      return new RoleListItem(currentRole.toObject());
    }

    const updated = await this.roleRepository.updateRole(command.id, patch);
    if (!updated) {
      throw new RoleNotFoundException();
    }

    await this.cacheManager.del(`role:${command.id}`);
    return new RoleListItem(updated.toObject());
  }
}
