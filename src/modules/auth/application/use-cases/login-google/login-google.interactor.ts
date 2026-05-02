import { IGoogleOAuthService } from '@/modules/core/application/ports/google-oauth.out-port';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { IRoleService } from '@/modules/role/application/services/role.service';
import { ERoleName } from '@/modules/role/domain/entities/role.type';
import { GoogleAccountNotVerifiedException } from '@/modules/auth/application/auth.exception';
import { IAuthService } from '@/modules/auth/application/services/auth.service';
import { IUserService } from '@/modules/user/application/services/user.service';
import {
  LoginGoogleCommand,
  LoginGoogleInPort,
  LoginGoogleResult
} from '@/modules/auth/application/use-cases/login-google/login-google.in-port';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

import { v4 as uuidv4 } from 'uuid'; // TODO: tách hàm util random id

export class LoginGoogleInteractor extends LoginGoogleInPort {
  constructor(
    private readonly googleOAuthService: IGoogleOAuthService,
    private readonly userRepository: UserRepositoryPort,
    private readonly hashingService: HashingPort,
    private readonly roleService: IRoleService,
    private readonly authService: IAuthService,
    private readonly userService: IUserService
  ) {
    super();
  }

  async execute({ code }: LoginGoogleCommand): Promise<LoginGoogleResult> {
    const { email, name, verifiedEmail } = await this.googleOAuthService.getUserInfoFromCode(code);

    if (!verifiedEmail || !email) {
      throw GoogleAccountNotVerifiedException;
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

    const randomPassword = uuidv4();
    const [userRoleId, hashedPassword] = await Promise.all([
      this.roleService.getUserRoleId(),
      this.hashingService.hash(randomPassword)
    ]);

    const userEntity = UserEntity.create({
      name,
      email,
      password: hashedPassword,
      birthday: new Date(),
      username: `user-${uuidv4()}`,
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
