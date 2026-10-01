import { CACHE_KEYS } from '@/modules/authorization/application/constants/cache.constants';
import {
  CannotDeactivateAdminRoleException,
  CannotRenameSystemRoleException,
  RoleNameAlreadyExistsException,
  RoleNotFoundException
} from '@/modules/authorization/application/exceptions/role.exception';
import { RoleListItem } from '@/modules/authorization/application/use-cases/list-roles/list-roles.port';
import {
  UpdateRoleInputPort,
  UpdateRolePort
} from '@/modules/authorization/application/use-cases/update-role/update-role.port';
import { EnumRoleName } from '@/modules/authorization/domain/entities/role.type';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import { UpdateRoleInput } from '@/modules/authorization/domain/repositories/role.repository.type';
import { RoleName } from '@/modules/authorization/domain/value-objects/role-name.value-object';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';

export class UpdateRoleUseCase extends UpdateRolePort {
  constructor(
    private readonly roleRepository: RoleRepositoryPort,
    private readonly cache: CacheManagerPort
  ) {
    super();
  }

  async execute(input: UpdateRoleInputPort) {
    const currentRole = await this.roleRepository.findRoleById(input.id);
    if (!currentRole) {
      throw new RoleNotFoundException();
    }
    const currentName = currentRole.getProps().name.value;

    if (input.name && RoleName.create(input.name).value !== currentName) {
      if (currentRole.isSystemRole()) {
        throw new CannotRenameSystemRoleException();
      }
      const existingRole = await this.roleRepository.findRoleByName(input.name);
      if (existingRole) {
        throw new RoleNameAlreadyExistsException();
      }
    }

    // The admin role cannot be deactivated.
    if (currentName === EnumRoleName.ADMIN && !input.isActive) {
      throw new CannotDeactivateAdminRoleException();
    }

    const patch: UpdateRoleInput = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;
    if (input.isActive !== undefined) patch.isActive = input.isActive;
    if (input.permissionIds !== undefined) patch.permissionIds = input.permissionIds;

    if (Object.keys(patch).length === 0) {
      return new RoleListItem(currentRole.toObject());
    }

    const updated = await this.roleRepository.updateRole(input.id, patch);
    if (!updated) {
      throw new RoleNotFoundException();
    }

    await this.cache.invalidate(CACHE_KEYS.role(input.id));
    return new RoleListItem(updated.toObject());
  }
}
