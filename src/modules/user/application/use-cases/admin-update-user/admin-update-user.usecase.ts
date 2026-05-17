import { RoleNotFoundException } from '@/modules/authorization/application/exceptions/role.exception';
import { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import {
  CannotAssignAdminRoleException,
  CannotMutateAdminUserException,
  UserAlreadyExistsException,
  UserNotFoundException,
  UsernameAlreadyExistsException
} from '@/modules/user/application/exceptions/user.exception';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import {
  AdminUpdateUserCommand,
  AdminUpdateUserPort,
  AdminUpdateUserResult
} from '@/modules/user/application/use-cases/admin-update-user/admin-update-user.port';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class AdminUpdateUserUseCase extends AdminUpdateUserPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly userService: UserServicePort,
    private readonly roleRepository: RoleRepositoryPort,
    private readonly roleService: RoleServicePort,
    private readonly hashingService: HashingPort,
    private readonly cache: CacheStrategyPort
  ) {
    super();
  }

  async execute(command: AdminUpdateUserCommand): Promise<AdminUpdateUserResult> {
    const current = await this.userRepository.findUserById(command.userId);
    if (!current) {
      throw new UserNotFoundException();
    }

    const currentUser = current.toObject();
    const adminRoleId = await this.roleService.getAdminRoleId();
    if (currentUser.roleId === adminRoleId) {
      throw new CannotMutateAdminUserException();
    }

    if (command.roleId) {
      if (command.roleId === adminRoleId) {
        throw new CannotAssignAdminRoleException();
      }

      const role = await this.roleRepository.findRoleById(command.roleId);
      if (!role) {
        throw new RoleNotFoundException();
      }
    }

    if (command.email && command.email !== currentUser.email) {
      const existingEmail = await this.userService.findUserByEmail(command.email, { querySafe: true });
      if (existingEmail && existingEmail.id !== command.userId) {
        throw new UserAlreadyExistsException();
      }
    }

    if (command.username && command.username !== currentUser.username) {
      const existingUsername = await this.userService.findUserByUsername(command.username, { querySafe: true });
      if (existingUsername && existingUsername.id !== command.userId) {
        throw new UsernameAlreadyExistsException();
      }
    }

    const password = command.password ? await this.hashingService.hash(command.password) : undefined;
    const updated = await this.userRepository.update(
      command.userId,
      {
        name: command.name,
        email: command.email,
        password,
        birthday: command.birthday,
        roleId: command.roleId,
        status: command.status,
        bio: command.bio,
        location: command.location,
        website: command.website,
        username: command.username,
        avatar: command.avatar,
        coverPhoto: command.coverPhoto
      } as Partial<UserEntity>,
      { actorId: command.actorId }
    );

    if (!updated) {
      throw new UserNotFoundException();
    }

    const updatedUser = updated.toObject();
    await this.invalidateUserCache(command.userId, [currentUser.username, updatedUser.username]);

    return new AdminUpdateUserResult(this.toSafeUser(updatedUser));
  }

  private async invalidateUserCache(userId: string, usernames: Array<string | undefined>): Promise<void> {
    const keys = [CACHE_KEYS.user(userId)];
    for (const username of usernames) {
      if (username) keys.push(CACHE_KEYS.userByUsername(username));
    }
    await Promise.all([...new Set(keys)].map((key) => this.cache.invalidate(key)));
  }

  private toSafeUser(user: ReturnType<UserEntity['toObject']>): UserSafeProps {
    const { password, totpSecret, ...safe } = user;
    void password;
    void totpSecret;
    return safe;
  }
}
