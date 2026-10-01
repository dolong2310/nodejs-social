import type { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import type { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constants';
import {
  CannotMutateAdminUserException,
  UserNotFoundException
} from '@/modules/user/application/exceptions/user.exception';
import {
  type AdminDeleteUserInputPort,
  AdminDeleteUserPort
} from '@/modules/user/application/use-cases/admin-delete-user/admin-delete-user.port';
import type { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class AdminDeleteUserUseCase extends AdminDeleteUserPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly roleService: RoleServicePort,
    private readonly cache: CacheManagerPort
  ) {
    super();
  }

  async execute(input: AdminDeleteUserInputPort): Promise<void> {
    const current = await this.userRepository.findUserById(input.userId);
    if (!current) {
      throw new UserNotFoundException();
    }

    const currentUser = current.toObject();
    const adminRoleId = await this.roleService.getAdminRoleId();
    if (currentUser.roleId === adminRoleId) {
      throw new CannotMutateAdminUserException();
    }

    const deleted = await this.userRepository.deleteById(input.userId, { actorId: input.actorId });
    if (!deleted) {
      throw new UserNotFoundException();
    }

    await this.invalidateUserCache(input.userId, currentUser.username);
  }

  private async invalidateUserCache(userId: string, username?: string): Promise<void> {
    const keys = [CACHE_KEYS.user(userId)];
    if (username) keys.push(CACHE_KEYS.userByUsername(username));
    await Promise.all(keys.map((key) => this.cache.invalidate(key)));
  }
}
