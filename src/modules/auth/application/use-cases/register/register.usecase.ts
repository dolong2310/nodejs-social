import { AuthServicePort } from '@/modules/auth/application/services/auth.service';
import { OtpServicePort } from '@/modules/auth/application/services/otp.service';
import {
  RegisterCommand,
  RegisterPort,
  RegisterResult
} from '@/modules/auth/application/use-cases/register/register.port';
import { EOtpType } from '@/modules/auth/domain/entities/otp.type';
import { OtpRepositoryPort } from '@/modules/auth/domain/repositories/otp.repository';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { generateId } from '@/modules/core/domain/helpers/ids';
import { RoleServicePort } from '@/modules/role/application/services/role.service';
import { UserAlreadyExistsException } from '@/modules/user/application/user.exception';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class RegisterUseCase extends RegisterPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly authService: AuthServicePort,
    private readonly hashingService: HashingPort,
    private readonly otpRepository: OtpRepositoryPort,
    private readonly otpService: OtpServicePort,
    private readonly roleService: RoleServicePort
  ) {
    super();
  }

  // user flow register:
  // 1. User input form email, password, confirm password, phone number
  // 2. Click button "Send OTP code" -> send OTP code to email
  // 3. User input OTP code
  // 4. Click button "Register" with additional OTP code
  // 5. Check OTP code
  // 6. Create user
  // 7. Delete OTP code
  // 8. Return user (successfully registered)
  async execute(command: RegisterCommand): Promise<RegisterResult> {
    const { name, email, password, birthday, code } = command;

    // 1. Check OTP code
    const otpEntity = await this.otpService.findAndValidateOtpCode({ email, code, type: EOtpType.REGISTER });

    // 2. Get user role id
    const userRoleId = await this.roleService.getUserRoleId();

    // 3. Hash password
    const hashedPassword = await this.hashingService.hash(password);

    // 4. Check existing user and create user
    const existingUserEntity = await this.userRepository.findUserByEmail(email);
    if (existingUserEntity) {
      throw new UserAlreadyExistsException();
    }
    const userEntity = UserEntity.create({
      name,
      email,
      password: hashedPassword,
      birthday: new Date(birthday),
      username: `user-${generateId()}`,
      roleId: userRoleId
    });
    const user = await this.userRepository.insert(userEntity, {
      projection: { password: 0, totpSecret: 0 }
    });

    // 5. Delete OTP code
    await this.otpRepository.deleteOtp(otpEntity.id.toString());

    return new RegisterResult(user.toObject());
  }
}
