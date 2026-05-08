import {
  RoleNotFoundException,
  SystemRoleCannotBeDeletedException
} from '@/modules/authorization/application/exceptions/role.exception';
import {
  DeleteRoleCommand,
  DeleteRolePort
} from '@/modules/authorization/application/use-cases/delete-role/delete-role.port';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';

export class DeleteRoleUseCase extends DeleteRolePort {
  constructor(
    private readonly roleRepository: RoleRepositoryPort,
    private readonly cacheManager: CacheManagerPort
  ) {
    super();
  }

  async execute(command: DeleteRoleCommand): Promise<void> {
    const current = await this.roleRepository.findRoleById(command.id);
    if (!current) {
      throw new RoleNotFoundException();
    }
    if (current.isSystemRole()) {
      throw new SystemRoleCannotBeDeletedException();
    }
    const removed = await this.roleRepository.deleteRole(command.id);
    if (!removed) {
      throw new RoleNotFoundException();
    }
    await this.cacheManager.del(`role:${command.id}`);
  }
}
