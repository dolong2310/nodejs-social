import { InvalidEmailOrPasswordException } from '@/application/exceptions/auth.exception';
import { RoleNotFoundException } from '@/application/exceptions/role.exception';
import { IHashingService } from '@/application/ports/hashing.port';
import { UserQueryRepositoryPort } from '@/application/queries/user/user-query.repository';
import { IAuthService } from '@/application/services/auth/auth.service';
import { IOtpService } from '@/application/services/otp/otp.service';
import {
  LoginEmailCommand,
  LoginEmailInPort,
  LoginEmailResult
} from '@/application/use-cases/auth/login-email/login-email.in-port';
import { EOtpType } from '@/domain/entities/otp/otp.type';
import { ERoleName } from '@/domain/entities/role/role.type';
import { RoleRepositoryPort } from '@/domain/repositories/role/role.repository';
import { UserRepositoryPort } from '@/domain/repositories/user/user.repository';

export class LoginEmailInteractor extends LoginEmailInPort {
  constructor(
    private readonly userQueryRepository: UserQueryRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
    private readonly roleRepository: RoleRepositoryPort,
    private readonly otpService: IOtpService,
    private readonly hashingService: IHashingService,
    private readonly authService: IAuthService
  ) {
    super();
  }

  async execute({ email, password, totpCode, emailOtpCode }: LoginEmailCommand): Promise<LoginEmailResult> {
    // 1. Check email exists in database
    const user = await this.userQueryRepository.findUserByIdIncludeRole(email);

    if (!user) {
      throw InvalidEmailOrPasswordException;
    }

    if (!user.role) {
      throw RoleNotFoundException;
    }

    // const userEntity = await this.userRepository.findUserByEmail(email);
    // const user = userEntity?.toObject();

    // if (!user) {
    //   throw InvalidEmailOrPasswordException;
    // }

    // 2. Check password is correct
    const isPasswordValid = await this.hashingService.compare(password, user.password);
    if (!isPasswordValid) {
      throw InvalidEmailOrPasswordException;
    }

    // 3. Check 2FA is enabled
    if (user.totpSecret) {
      // Validate TOTP code or email OTP code
      await this.otpService.validateTOTPCodeOrEmailOtpCode({
        totpCode,
        emailOtpCode,
        totpSecret: user.totpSecret,
        email: user.email,
        type: EOtpType.LOGIN
      });
    }

    // // 4. Get role name of user
    // const roleEntity = await this.roleRepository.findRoleById(user.roleId);

    // if (!roleEntity) {
    //   throw RoleNotFoundException;
    // }

    const authSession = await this.authService.createAuthSession(
      { userId: user.id, roleId: user.roleId, roleName: user.role.name as ERoleName },
      { isCreateInDatabase: true }
    );

    return new LoginEmailResult(authSession);
  }
}
