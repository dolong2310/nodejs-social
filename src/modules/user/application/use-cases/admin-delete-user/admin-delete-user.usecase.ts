import { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import {
  CannotMutateAdminUserException,
  UserNotFoundException
} from '@/modules/user/application/exceptions/user.exception';
import {
  AdminDeleteUserCommand,
  AdminDeleteUserPort
} from '@/modules/user/application/use-cases/admin-delete-user/admin-delete-user.port';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class AdminDeleteUserUseCase extends AdminDeleteUserPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly roleService: RoleServicePort,
    private readonly cache: CacheStrategyPort
  ) {
    super();
  }

  async execute(command: AdminDeleteUserCommand): Promise<void> {
    const current = await this.userRepository.findUserById(command.userId);
    if (!current) {
      throw new UserNotFoundException();
    }

    const currentUser = current.toObject();
    const adminRoleId = await this.roleService.getAdminRoleId();
    if (currentUser.roleId === adminRoleId) {
      throw new CannotMutateAdminUserException();
    }

    const deleted = await this.userRepository.deleteById(command.userId, { actorId: command.actorId });
    if (!deleted) {
      throw new UserNotFoundException();
    }

    await this.invalidateUserCache(command.userId, currentUser.username);
  }

  private async invalidateUserCache(userId: string, username?: string): Promise<void> {
    const keys = [CACHE_KEYS.user(userId)];
    if (username) keys.push(CACHE_KEYS.userByUsername(username));
    await Promise.all(keys.map((key) => this.cache.invalidate(key)));
  }
}
