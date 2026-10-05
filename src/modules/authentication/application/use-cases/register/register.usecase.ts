import type { OtpServicePort } from '@/modules/authentication/application/services/otp.service';
import {
  type RegisterInputPort,
  RegisterPort,
  RegisterOutputPort
} from '@/modules/authentication/application/use-cases/register/register.port';
import { EnumOtpType } from '@/modules/authentication/domain/entities/otp.types';
import type { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import type { RoleServicePort } from '@/modules/authorization/application/services/role.service';
import { generateUniqueString } from '@/modules/common/utils/random-string.util';
import type { HashingPort } from '@/modules/core/application/ports/hashing.port';
import type { UnitOfWorkPort } from '@/modules/core/application/ports/unit-of-work.port';
import { UserAlreadyExistsException } from '@/modules/user/application/exceptions/user.exception';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import type { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class RegisterUseCase extends RegisterPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly hashingService: HashingPort,
    private readonly otpRepository: OtpRepositoryPort,
    private readonly otpService: OtpServicePort,
    private readonly roleService: RoleServicePort,
    private readonly unitOfWork: UnitOfWorkPort
  ) {
    super();
  }

  // user flow register:
  // 1. User input form email, password, confirm password, phone number
  // 2. Click button "Send OTP code" -> send OTP code to email
  // 3. User input OTP code
  // 4. Click button "Register" with additional OTP code
  // 5. Check OTP code
  // 6. Create user and delete OTP code in one transaction
  // 7. Return user (successfully registered)
  async execute(input: RegisterInputPort): Promise<RegisterOutputPort> {
    const { name, email, password, birthday, code } = input;

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
    // 5. Create user and consume the OTP atomically, so a failed insert never burns the code
    // and a created user never leaves a reusable code behind.
    const user = await this.unitOfWork.run(async () => {
      const insertedUser = await this.userRepository.insert(userEntity, {
        projection: { password: 0, totpSecret: 0 }
      });
      await this.otpRepository.deleteOtp(otpEntity.id.toString());
      return insertedUser;
    });

    return new RegisterOutputPort(user.toObject());
  }
}
