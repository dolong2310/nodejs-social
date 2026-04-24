import { CACHE_KEYS } from '@/application/common/constants/cache.constant';
import { EmailNotFoundException } from '@/application/exceptions/auth.exception';
import { IHashingService } from '@/application/ports/hashing.port';
import { RedisPort } from '@/application/ports/redis.port';
import { IOtpService } from '@/application/services/otp/otp.service';
import { IUserService } from '@/application/services/user/user.service';
import {
  ForgotPasswordCommand,
  ForgotPasswordInPort
} from '@/application/use-cases/auth/forgot-password/forgot-password.in-port';
import { EOtpType } from '@/domain/entities/otp/otp.type';
import { OtpRepositoryPort } from '@/domain/repositories/otp/otp.repository';
import { UserRepositoryPort } from '@/domain/repositories/user/user.repository';

export class ForgotPasswordInteractor extends ForgotPasswordInPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly redis: RedisPort,
    private readonly otpRepository: OtpRepositoryPort,
    private readonly hashingService: IHashingService,
    private readonly userService: IUserService,
    private readonly otpService: IOtpService
  ) {
    super();
  }

  /**
    Forgot Password Form:
    [email]
    [code] [button send otp]
    [new password]
    [confirm new password]
    [button submit]
  */
  async execute({ email, code, password }: ForgotPasswordCommand): Promise<boolean> {
    // 1. Check OTP code
    const otpEntity = await this.otpService.findAndValidateOtpCode({
      email,
      code,
      type: EOtpType.FORGOT_PASSWORD
    });

    // 2. Check email exists in database
    const user = await this.userService.findUserByEmail(email);

    if (!user) {
      // Delete OTP code
      await this.otpRepository.deleteOtp(otpEntity.id.toString());
      throw EmailNotFoundException;
    }

    // 3. Hash new password
    const hashedPassword = await this.hashingService.hash(password);

    // 4. Update user password
    const updateUserPasswordPromise = this.userRepository.resetPassword(user.id, { password: hashedPassword });

    // 5. Delete OTP code
    const deleteOtpCodePromise = this.otpRepository.deleteOtp(otpEntity.id.toString());

    // 6. Execute promises
    await Promise.all([updateUserPasswordPromise, deleteOtpCodePromise]);
    await this.redis.del(CACHE_KEYS.user(user.id));

    // 7. Return true success
    return true;
  }
}
