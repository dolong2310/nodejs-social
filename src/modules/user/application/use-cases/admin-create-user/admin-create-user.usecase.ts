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
  AdminCreateUserInputPort,
  AdminCreateUserPort,
  AdminCreateUserOutputPort
} from '@/modules/user/application/use-cases/admin-create-user/admin-create-user.port';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserSafeProps } from '@/modules/user/domain/entities/user.types';
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

  async execute(input: AdminCreateUserInputPort): Promise<AdminCreateUserOutputPort> {
    const adminRoleId = await this.roleService.getAdminRoleId();
    if (input.roleId === adminRoleId) {
      throw new CannotAssignAdminRoleException();
    }

    const role = await this.roleRepository.findRoleById(input.roleId);
    if (!role) {
      throw new RoleNotFoundException();
    }

    const existingEmail = await this.userService.findUserByEmail(input.email, { querySafe: true });
    if (existingEmail) {
      throw new UserAlreadyExistsException();
    }

    if (input.username) {
      const existingUsername = await this.userService.findUserByUsername(input.username, { querySafe: true });
      if (existingUsername) {
        throw new UsernameAlreadyExistsException();
      }
    }

    const hashedPassword = await this.hashingService.hash(input.password);
    const entity = UserEntity.create({
      name: input.name,
      email: input.email,
      password: hashedPassword,
      birthday: input.birthday,
      roleId: input.roleId,
      status: input.status,
      bio: input.bio,
      location: input.location,
      website: input.website,
      username: input.username,
      avatar: input.avatar,
      coverPhoto: input.coverPhoto
    });

    const created = await this.userRepository.insert(entity, { actorId: input.actorId });
    return new AdminCreateUserOutputPort(this.toSafeUser(created.toObject()));
  }

  private toSafeUser(user: ReturnType<UserEntity['toObject']>): UserSafeProps {
    const { password, totpSecret, ...safe } = user;
    void password;
    void totpSecret;
    return safe;
  }
}
