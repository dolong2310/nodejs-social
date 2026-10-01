import { UserAlreadyHas2FAException } from '@/modules/authentication/application/exceptions/otp.exception';
import type { TwoFactorAuthPort } from '@/modules/authentication/application/ports/2fa.port';
import {
  type Setup2FAInputPort,
  Setup2FAOutputPort,
  Setup2FAPort
} from '@/modules/authentication/application/use-cases/setup-2fa/setup-2fa.port';
import type { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constants';
import { UserNotFoundException } from '@/modules/user/application/exceptions/user.exception';
import type { UserServicePort } from '@/modules/user/application/services/user.service';
import type { UserEntity } from '@/modules/user/domain/entities/user.entity';
import type { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class Setup2FAUseCase extends Setup2FAPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly userService: UserServicePort,
    private readonly twoFactorAuthenticationService: TwoFactorAuthPort,
    private readonly cache: CacheManagerPort
  ) {
    super();
  }

  async execute(input: Setup2FAInputPort): Promise<Setup2FAOutputPort> {
    const { userId } = input;
    // 1. Load user from the database, verify the user exists, and verify 2FA is not already enabled.
    const user = await this.userService.findUserById(userId);

    if (!user) {
      throw new UserNotFoundException();
    }

    if (user.totpSecret) {
      throw new UserAlreadyHas2FAException();
    }

    // 2. Create the secret key and URI for 2FA.
    const { secret, uri } = this.twoFactorAuthenticationService.generateSecret(user.email);

    // 3. Save the secret key to the database.
    await this.userRepository.updateOne(userId, { totpSecret: secret } as Partial<UserEntity>);

    // 4. Delete user from cache
    await this.cache.invalidate(CACHE_KEYS.user(user.id));

    // 5. Return the secret key and URI.
    return new Setup2FAOutputPort({
      secret,
      uri
    });
  }
}
