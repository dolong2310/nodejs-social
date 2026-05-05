import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { RoleNotFoundException, SystemRoleCannotBeDeletedException } from '@/modules/role/application/role.exception';
import {
  DeleteRoleCommand,
  DeleteRoleInPort
} from '@/modules/role/application/use-cases/delete-role/delete-role.in-port';
import { RoleRepositoryPort } from '@/modules/role/domain/repositories/role.repository';

export class DeleteRoleInteractor extends DeleteRoleInPort {
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
