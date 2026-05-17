import { RoleNotFoundException } from '@/modules/authorization/application/exceptions/role.exception';
import { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import {
  CannotAssignAdminRoleException,
  UserAlreadyExistsException,
  UsernameAlreadyExistsException
} from '@/modules/user/application/exceptions/user.exception';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import {
  AdminCreateUserCommand,
  AdminCreateUserPort,
  AdminCreateUserResult
} from '@/modules/user/application/use-cases/admin-create-user/admin-create-user.port';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class AdminCreateUserUseCase extends AdminCreateUserPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly userService: UserServicePort,
    private readonly roleRepository: RoleRepositoryPort,
    private readonly roleService: RoleServicePort,
    private readonly hashingService: HashingPort
  ) {
    super();
  }

  async execute(command: AdminCreateUserCommand): Promise<AdminCreateUserResult> {
    const adminRoleId = await this.roleService.getAdminRoleId();
    if (command.roleId === adminRoleId) {
      throw new CannotAssignAdminRoleException();
    }

    const role = await this.roleRepository.findRoleById(command.roleId);
    if (!role) {
      throw new RoleNotFoundException();
    }

    const existingEmail = await this.userService.findUserByEmail(command.email, { querySafe: true });
    if (existingEmail) {
      throw new UserAlreadyExistsException();
    }

    if (command.username) {
      const existingUsername = await this.userService.findUserByUsername(command.username, { querySafe: true });
      if (existingUsername) {
        throw new UsernameAlreadyExistsException();
      }
    }

    const hashedPassword = await this.hashingService.hash(command.password);
    const entity = UserEntity.create({
      name: command.name,
      email: command.email,
      password: hashedPassword,
      birthday: command.birthday,
      roleId: command.roleId,
      status: command.status,
      bio: command.bio,
      location: command.location,
      website: command.website,
      username: command.username,
      avatar: command.avatar,
      coverPhoto: command.coverPhoto
    });

    const created = await this.userRepository.insert(entity, { actorId: command.actorId });
    return new AdminCreateUserResult(this.toSafeUser(created.toObject()));
  }

  private toSafeUser(user: ReturnType<UserEntity['toObject']>): UserSafeProps {
    const { password, totpSecret, ...safe } = user;
    void password;
    void totpSecret;
    return safe;
  }
}
