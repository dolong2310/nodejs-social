import { UserNotEnabled2FAException } from '@/modules/authentication/application/exceptions/otp.exception';
import type { OtpServicePort } from '@/modules/authentication/application/services/otp.service';
import {
  type Disable2FAInputPort,
  Disable2FAPort
} from '@/modules/authentication/application/use-cases/disable-2fa/disable-2fa.port';
import { EnumOtpType } from '@/modules/authentication/domain/entities/otp.types';
import type { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constants';
import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';
import type { UserServicePort } from '@/modules/user/application/services/user.service';
import type { UserEntity } from '@/modules/user/domain/entities/user.entity';
import type { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class Disable2FAUseCase extends Disable2FAPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly userService: UserServicePort,
    private readonly otpService: OtpServicePort,
    private readonly cache: CacheManagerPort
  ) {
    super();
  }

  async execute(input: Disable2FAInputPort): Promise<boolean> {
    const { userId, totpCode, emailOtpCode } = input;
    // 1. Load user from the database, verify the user exists, and verify 2FA is enabled.
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
      type: EnumOtpType.DISABLE_2FA
    });

    // 3. Delete secret key of user from database
    await this.userRepository.updateOne(userId, { totpSecret: null } as Partial<UserEntity>);

    // 4. Delete user from cache
    await this.cache.invalidate(CACHE_KEYS.user(user.id));

    // 5. Return boolean success
    return true;
  }
}
