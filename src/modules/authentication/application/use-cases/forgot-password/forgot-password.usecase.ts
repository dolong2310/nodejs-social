import { EmailNotFoundException } from '@/modules/authentication/application/exceptions/auth.exception';
import { OtpServicePort } from '@/modules/authentication/application/services/otp.service';
import {
  ForgotPasswordCommand,
  ForgotPasswordPort
} from '@/modules/authentication/application/use-cases/forgot-password/forgot-password.port';
import { EOtpType } from '@/modules/authentication/domain/entities/otp.type';
import { OtpRepositoryPort } from '@/modules/authentication/domain/repositories/otp.repository';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class ForgotPasswordUseCase extends ForgotPasswordPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly cacheManager: CacheManagerPort,
    private readonly otpRepository: OtpRepositoryPort,
    private readonly hashingService: HashingPort,
    private readonly userService: UserServicePort,
    private readonly otpService: OtpServicePort
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
      throw new EmailNotFoundException();
    }

    // 3. Hash new password
    const hashedPassword = await this.hashingService.hash(password);

    // 4. Update user password
    const updateUserPasswordPromise = this.userRepository.resetPassword(user.id, { password: hashedPassword });

    // 5. Delete OTP code
    const deleteOtpCodePromise = this.otpRepository.deleteOtp(otpEntity.id.toString());

    // 6. Execute promises
    await Promise.all([updateUserPasswordPromise, deleteOtpCodePromise]);
    await this.cacheManager.del(CACHE_KEYS.user(user.id));

    // 7. Return true success
    return true;
  }
}
