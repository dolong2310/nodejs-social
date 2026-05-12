import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import {
  ChangePasswordCommand,
  ChangePasswordPort
} from '@/modules/user/application/use-cases/change-password/change-password.port';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class ChangePasswordUseCase extends ChangePasswordPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly hashingService: HashingPort,
    private readonly cache: CacheStrategyPort
  ) {
    super();
  }

  async execute({ userId, password }: ChangePasswordCommand): Promise<boolean> {
    const hashedPassword = await this.hashingService.hash(password);

    await this.userRepository.changePassword(userId, { password: hashedPassword });
    await this.cache.invalidate(CACHE_KEYS.user(userId));

    return true;
  }
}
