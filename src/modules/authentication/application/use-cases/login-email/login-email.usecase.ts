import { InvalidEmailOrPasswordException } from '@/modules/authentication/application/exceptions/auth.exception';
import { AuthServicePort } from '@/modules/authentication/application/services/auth.service';
import { OtpServicePort } from '@/modules/authentication/application/services/otp.service';
import {
  LoginEmailCommand,
  LoginEmailPort,
  LoginEmailResult
} from '@/modules/authentication/application/use-cases/login-email/login-email.port';
import { EOtpType } from '@/modules/authentication/domain/entities/otp.type';
import { RoleNotFoundException } from '@/modules/authorization/application/exceptions/role.exception';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';

export class LoginEmailUseCase extends LoginEmailPort {
  constructor(
    private readonly userQueryRepository: UserQueryRepositoryPort,
    private readonly otpService: OtpServicePort,
    private readonly hashingService: HashingPort,
    private readonly authService: AuthServicePort
  ) {
    super();
  }

  async execute({ email, password, totpCode, emailOtpCode }: LoginEmailCommand): Promise<LoginEmailResult> {
    // 1. Check email exists in database
    const user = await this.userQueryRepository.findUserByEmailIncludeRole(email);

    if (!user) {
      throw new InvalidEmailOrPasswordException();
    }

    if (!user.role) {
      throw new RoleNotFoundException();
    }

    // 2. Check password is correct
    const isPasswordValid = await this.hashingService.compare(password, user.password);
    if (!isPasswordValid) {
      throw new InvalidEmailOrPasswordException();
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

    const authSession = await this.authService.createAuthSession(
      { userId: user.id, roleId: user.roleId, roleName: user.role.name },
      { isCreateInDatabase: true }
    );

    return new LoginEmailResult(authSession);
  }
}
