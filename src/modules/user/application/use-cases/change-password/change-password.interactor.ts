import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { HashingPort } from '@/modules/core/application/ports/hashing.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import {
  ChangePasswordCommand,
  ChangePasswordInPort
} from '@/modules/user/application/use-cases/change-password/change-password.in-port';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class ChangePasswordInteractor extends ChangePasswordInPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly hashingService: HashingPort,
    private readonly cacheManager: CacheManagerPort
  ) {
    super();
  }

  async execute({ userId, password }: ChangePasswordCommand): Promise<boolean> {
    const hashedPassword = await this.hashingService.hash(password);

    await this.userRepository.changePassword(userId, { password: hashedPassword });
    await this.cacheManager.del(CACHE_KEYS.user(userId));

    return true;
  }
}
