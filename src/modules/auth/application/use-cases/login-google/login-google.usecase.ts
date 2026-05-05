import { GoogleAccountNotVerifiedException } from '@/modules/auth/application/auth.exception';
import { GoogleOAuthServicePort } from '@/modules/auth/application/ports/google-oauth.out-port';
import { AuthServicePort } from '@/modules/auth/application/services/auth.service';
import {
  LoginGoogleCommand,
  LoginGooglePort,
  LoginGoogleResult
} from '@/modules/auth/application/use-cases/login-google/login-google.port';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { generateId } from '@/modules/core/domain/helpers/ids';
import { RoleServicePort } from '@/modules/role/application/services/role.service';
import { ERoleName } from '@/modules/role/domain/entities/role.type';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

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

  async execute({ code }: LoginGoogleCommand): Promise<LoginGoogleResult> {
    const { email, name, verifiedEmail } = await this.googleOAuthService.getUserInfoFromCode(code);

    if (!verifiedEmail || !email) {
      throw new GoogleAccountNotVerifiedException();
    }

    const user = await this.userService.findUserByEmail(email);

    if (user) {
      const authSession = await this.authService.createAuthSession(
        { userId: user.id, roleId: user.roleId, roleName: ERoleName.USER },
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
      username: `user-${generateId()}`,
      roleId: userRoleId
    });
    const newUser = await this.userRepository.insert(userEntity, {
      projection: { password: 0, totpSecret: 0 }
    });

    const authSession = await this.authService.createAuthSession(
      {
        userId: newUser.id.toString(),
        roleId: newUser.getProps().roleId,
        roleName: ERoleName.USER
      },
      { isCreateInDatabase: true }
    );

    return new LoginGoogleResult(authSession);
  }
}
