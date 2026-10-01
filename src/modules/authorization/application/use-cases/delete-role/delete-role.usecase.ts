import { CACHE_KEYS } from '@/modules/authorization/application/constants/cache.constants';
import {
  RoleNotFoundException,
  SystemRoleCannotBeDeletedException
} from '@/modules/authorization/application/exceptions/role.exception';
import {
  DeleteRoleInputPort,
  DeleteRolePort
} from '@/modules/authorization/application/use-cases/delete-role/delete-role.port';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';

export class DeleteRoleUseCase extends DeleteRolePort {
  constructor(
    private readonly roleRepository: RoleRepositoryPort,
    private readonly cache: CacheManagerPort
  ) {
    super();
  }

  async execute(input: DeleteRoleInputPort): Promise<void> {
    const current = await this.roleRepository.findRoleById(input.id);
    if (!current) {
      throw new RoleNotFoundException();
    }
    if (current.isSystemRole()) {
      throw new SystemRoleCannotBeDeletedException();
    }
    await this.cache.delete(CACHE_KEYS.role(input.id), async () => {
      const removed = await this.roleRepository.deleteRole(input.id, { actorId: input.actorId });
      if (!removed) {
        throw new RoleNotFoundException();
      }
    });
  }
}
