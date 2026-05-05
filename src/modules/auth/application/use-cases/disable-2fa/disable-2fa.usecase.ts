import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { UserNotEnabled2FAException } from '@/modules/auth/application/otp.exception';
import { OtpServicePort } from '@/modules/auth/application/services/otp.service';
import { EOtpType } from '@/modules/auth/domain/entities/otp.type';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { Disable2FACommand, Disable2FAPort } from '@/modules/auth/application/use-cases/disable-2fa/disable-2fa.port';
import { UserNotFoundException } from '@/modules/user/application/user.exception';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class Disable2FAUseCase extends Disable2FAPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly userService: UserServicePort,
    private readonly otpService: OtpServicePort,
    private readonly cacheManager: CacheManagerPort
  ) {
    super();
  }

  async execute({ userId, totpCode, emailOtpCode }: Disable2FACommand): Promise<boolean> {
    // 1. Lấy user từ database, kiểm tra user có tồn tại không và kiểm tra đã enable 2FA chưa
    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    if (!user.totpSecret) {
      throw new UserNotEnabled2FAException();
    }

    // 2. Validate TOTP code or email OTP code
    await this.otpService.validateTOTPCodeOrEmailOtpCode({
      totpCode,
      emailOtpCode,
      totpSecret: user.totpSecret,
      email: user.email,
      type: EOtpType.DISABLE_2FA
    });

    // 3. Delete secret key of user from database
    await this.userRepository.updateOne(userId, { totpSecret: null } as Partial<UserEntity>);

    // 4. Delete user from cache
    await this.cacheManager.del(CACHE_KEYS.user(user.id));

    // 5. Return boolean success
    return true;
  }
}
