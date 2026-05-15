import { OtpServicePort } from '@/modules/authentication/application/services/otp.service';
import {
  RegisterCommand,
  RegisterPort,
  RegisterResult
} from '@/modules/authentication/application/use-cases/register/register.port';
import { EnumOtpType } from '@/modules/authentication/domain/entities/otp.type';
import { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import { generateUniqueString } from '@/modules/common/utils/random-string.util';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { UserAlreadyExistsException } from '@/modules/user/application/exceptions/user.exception';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class RegisterUseCase extends RegisterPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
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
    const otpEntity = await this.otpService.findAndValidateOtpCode({ email, code, type: EnumOtpType.REGISTER });

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
      username: `user_${generateUniqueString()}`,
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
