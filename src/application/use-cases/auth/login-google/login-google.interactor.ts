import { GoogleAccountNotVerifiedException } from '@/application/exceptions/auth.exception';
import { IGoogleOAuthService } from '@/application/ports/google-oauth.out-port';
import { IHashingService } from '@/application/ports/hashing.port';
import { IAuthService } from '@/application/services/auth/auth.service';
import { IRoleService } from '@/application/services/role/role.service';
import { IUserService } from '@/application/services/user/user.service';
import {
  LoginGoogleCommand,
  LoginGoogleInPort,
  LoginGoogleResult
} from '@/application/use-cases/auth/login-google/login-google.in-port';
import { ERoleName } from '@/domain/entities/role/role.type';
import { UserEntity } from '@/domain/entities/user/user.entity';
import { UserRepositoryPort } from '@/domain/repositories/user/user.repository';

import { v4 as uuidv4 } from 'uuid'; // TODO: tách hàm util random id

export class LoginGoogleInteractor extends LoginGoogleInPort {
  constructor(
    private readonly googleOAuthService: IGoogleOAuthService,
    private readonly userRepository: UserRepositoryPort,
    private readonly hashingService: IHashingService,
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
