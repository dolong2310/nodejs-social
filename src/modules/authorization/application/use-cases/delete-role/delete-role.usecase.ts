import { CACHE_KEYS } from '@/modules/authorization/application/constants/cache.constant';
import {
  RoleNotFoundException,
  SystemRoleCannotBeDeletedException
} from '@/modules/authorization/application/exceptions/role.exception';
import {
  DeleteRoleCommand,
  DeleteRolePort
} from '@/modules/authorization/application/use-cases/delete-role/delete-role.port';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';

export class DeleteRoleUseCase extends DeleteRolePort {
  constructor(
    private readonly roleRepository: RoleRepositoryPort,
    private readonly cache: CacheStrategyPort
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
    await this.cache.delete(CACHE_KEYS.role(command.id), async () => {
      const removed = await this.roleRepository.deleteRole(command.id, { actorId: command.actorId });
      if (!removed) {
        throw new RoleNotFoundException();
      }
    });
  }
}
