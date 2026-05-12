import { UserNotEnabled2FAException } from '@/modules/authentication/application/exceptions/otp.exception';
import { OtpServicePort } from '@/modules/authentication/application/services/otp.service';
import {
  Disable2FACommand,
  Disable2FAPort
} from '@/modules/authentication/application/use-cases/disable-2fa/disable-2fa.port';
import { EOtpType } from '@/modules/authentication/domain/entities/otp.type';
import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class Disable2FAUseCase extends Disable2FAPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly userService: UserServicePort,
    private readonly otpService: OtpServicePort,
    private readonly cache: CacheStrategyPort
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
    await this.cache.invalidate(CACHE_KEYS.user(user.id));

    // 5. Return boolean success
    return true;
  }
}
