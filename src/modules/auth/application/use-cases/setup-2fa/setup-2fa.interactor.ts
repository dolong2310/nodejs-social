import { TwoFactorAuthPort } from '@/modules/auth/application/ports/2fa.port';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { UserAlreadyHas2FAException } from '@/modules/auth/application/otp.exception';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import {
  Setup2FACommand,
  Setup2FAInPort,
  Setup2FAResult
} from '@/modules/auth/application/use-cases/setup-2fa/setup-2fa.in-port';
import { UserNotFoundException } from '@/modules/user/application/user.exception';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class Setup2FAInteractor extends Setup2FAInPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly userService: UserServicePort,
    private readonly twoFactorAuthenticationService: TwoFactorAuthPort,
    private readonly cacheManager: CacheManagerPort
  ) {
    super();
  }

  async execute({ userId }: Setup2FACommand): Promise<Setup2FAResult> {
    // 1. Lấy user từ database, kiểm tra user có tồn tại không và kiểm tra đã enable 2FA chưa
    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.totpSecret) {
      throw new UserAlreadyHas2FAException();
    }

    // 2. Tạo secret key và URI cho 2FA
    const { secret, uri } = this.twoFactorAuthenticationService.generateSecret(user.email);

    // 3. Lưu secret key vào database
    await this.userRepository.updateOne(userId, { totpSecret: secret } as Partial<UserEntity>);

    // 4. Delete user from cache
    await this.cacheManager.del(CACHE_KEYS.user(user.id));

    // 5. Return secret key và URI
    return new Setup2FAResult({
      secret,
      uri
    });
  }
}
