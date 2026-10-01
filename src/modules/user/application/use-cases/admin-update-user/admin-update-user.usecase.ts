import { RoleNotFoundException } from '@/modules/authorization/application/exceptions/role.exception';
import { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constants';
import {
  CannotAssignAdminRoleException,
  CannotMutateAdminUserException,
  UserAlreadyExistsException,
  UserNotFoundException,
  UsernameAlreadyExistsException
} from '@/modules/user/application/exceptions/user.exception';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import {
  AdminUpdateUserInputPort,
  AdminUpdateUserOutputPort,
  AdminUpdateUserPort
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
    private readonly cache: CacheManagerPort
  ) {
    super();
  }

  async execute(input: AdminUpdateUserInputPort): Promise<AdminUpdateUserOutputPort> {
    const current = await this.userRepository.findUserById(input.userId);
    if (!current) {
      throw new UserNotFoundException();
    }

    const currentUser = current.toObject();
    const adminRoleId = await this.roleService.getAdminRoleId();
    if (currentUser.roleId === adminRoleId) {
      throw new CannotMutateAdminUserException();
    }

    if (input.roleId) {
      if (input.roleId === adminRoleId) {
        throw new CannotAssignAdminRoleException();
      }

      const role = await this.roleRepository.findRoleById(input.roleId);
      if (!role) {
        throw new RoleNotFoundException();
      }
    }

    if (input.email && input.email !== currentUser.email) {
      const existingEmail = await this.userService.findUserByEmail(input.email, { querySafe: true });
      if (existingEmail && existingEmail.id !== input.userId) {
        throw new UserAlreadyExistsException();
      }
    }

    if (input.username && input.username !== currentUser.username) {
      const existingUsername = await this.userService.findUserByUsername(input.username, { querySafe: true });
      if (existingUsername && existingUsername.id !== input.userId) {
        throw new UsernameAlreadyExistsException();
      }
    }

    const password = input.password ? await this.hashingService.hash(input.password) : undefined;
    const updated = await this.userRepository.update(
      input.userId,
      {
        name: input.name,
        email: input.email,
        password,
        birthday: input.birthday,
        roleId: input.roleId,
        status: input.status,
        bio: input.bio,
        location: input.location,
        website: input.website,
        username: input.username,
        avatar: input.avatar,
        coverPhoto: input.coverPhoto
      } as Partial<UserEntity>,
      { actorId: input.actorId }
    );

    if (!updated) {
      throw new UserNotFoundException();
    }

    const updatedUser = updated.toObject();
    await this.invalidateUserCache(input.userId, [currentUser.username, updatedUser.username]);

    return new AdminUpdateUserOutputPort(this.toSafeUser(updatedUser));
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
