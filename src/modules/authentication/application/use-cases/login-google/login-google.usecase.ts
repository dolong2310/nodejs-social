import { GoogleAccountNotVerifiedException } from '@/modules/authentication/application/exceptions/auth.exception';
import type { GoogleOAuthServicePort } from '@/modules/authentication/application/ports/google-oauth.port';
import type { AuthServicePort } from '@/modules/authentication/application/services/auth.service';
import {
  type LoginGoogleInputPort,
  LoginGooglePort,
  LoginGoogleOutputPort
} from '@/modules/authentication/application/use-cases/login-google/login-google.port';
import type { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import { EnumRoleName } from '@/modules/authorization/domain/entities/role.types';
import { generateUniqueString } from '@/modules/common/utils/random-string.util';
import type { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { generateId } from '@/modules/core/domain/helpers/ids';
import type { UserServicePort } from '@/modules/user/application/services/user.service';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import type { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class LoginGoogleUseCase extends LoginGooglePort {
  constructor(
    private readonly googleOAuthService: GoogleOAuthServicePort,
    private readonly userRepository: UserRepositoryPort,
    private readonly hashingService: HashingPort,
    private readonly roleService: RoleServicePort,
    private readonly authService: AuthServicePort,
    private readonly userService: UserServicePort
  ) {
    super();
  }

  async execute(input: LoginGoogleInputPort): Promise<LoginGoogleOutputPort> {
    const { code } = input;
    const { email, name, verifiedEmail } = await this.googleOAuthService.getUserInfoFromCode(code);

    if (!verifiedEmail || !email) {
      throw new GoogleAccountNotVerifiedException();
    }

    const user = await this.userService.findUserByEmail(email);

    if (user) {
      const authSession = await this.authService.createAuthSession(
        { userId: user.id, roleId: user.roleId, roleName: EnumRoleName.USER },
        { isCreateInDatabase: true }
      );
      return {
        accessToken: authSession.accessToken,
        refreshToken: authSession.refreshToken
      };
    }

    const randomPassword = generateId();
    const [userRoleId, hashedPassword] = await Promise.all([
      this.roleService.getUserRoleId(),
      this.hashingService.hash(randomPassword)
    ]);

    const userEntity = UserEntity.create({
      name,
      email,
      password: hashedPassword,
      birthday: new Date(),
      username: `user_${generateUniqueString()}`,
      roleId: userRoleId
    });
    const newUser = await this.userRepository.insert(userEntity, {
      projection: { password: 0, totpSecret: 0 }
    });

    const authSession = await this.authService.createAuthSession(
      {
        userId: newUser.id.toString(),
        roleId: newUser.getProps().roleId,
        roleName: EnumRoleName.USER
      },
      { isCreateInDatabase: true }
    );

    return new LoginGoogleOutputPort(authSession);
  }
}
