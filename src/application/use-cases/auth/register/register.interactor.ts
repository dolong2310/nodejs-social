import { UserAlreadyExistsException } from '@/application/exceptions/user.exception';
import { IHashingService } from '@/application/ports/hashing.port';
import { IAuthService } from '@/application/services/auth/auth.service';
import { IOtpService } from '@/application/services/otp/otp.service';
import { IRoleService } from '@/application/services/role/role.service';
import {
  RegisterCommand,
  RegisterInPort,
  RegisterResult
} from '@/application/use-cases/auth/register/register.in-port';
import { EOtpType } from '@/domain/entities/otp/otp.type';
import { UserEntity } from '@/domain/entities/user/user.entity';
import { OtpRepositoryPort } from '@/domain/repositories/otp/otp.repository';
import { UserRepositoryPort } from '@/domain/repositories/user/user.repository';
import { v4 as uuidv4 } from 'uuid'; // TODO: tách hàm util random id

export class RegisterInteractor extends RegisterInPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly authService: IAuthService,
    private readonly hashingService: IHashingService,
    private readonly otpRepository: OtpRepositoryPort,
    private readonly otpService: IOtpService,
    private readonly roleService: IRoleService
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
    const hashedPassword = password ? await this.hashingService.hash(password) : uuidv4();

    // 4. Check existing user and create user
    const existingUserEntity = await this.userRepository.findUserByEmail(email);
    if (existingUserEntity) {
      throw UserAlreadyExistsException;
    }
    const userEntity = UserEntity.create({
      name,
      email,
      password: hashedPassword,
      birthday: new Date(birthday),
      username: `user-${uuidv4()}`,
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
