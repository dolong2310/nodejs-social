import { CACHE_KEYS } from '@/application/common/constants/cache.constant';
import { IHashingService } from '@/application/ports/hashing.port';
import { RedisPort } from '@/application/ports/redis.port';
import {
  ChangePasswordCommand,
  ChangePasswordInPort
} from '@/application/use-cases/user/change-password/change-password.in-port';
import { UserRepositoryPort } from '@/domain/repositories/user/user.repository';

export class ChangePasswordInteractor extends ChangePasswordInPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly hashingService: IHashingService,
    private readonly redis: RedisPort
  ) {
    super();
  }

  async execute({ userId, password }: ChangePasswordCommand): Promise<boolean> {
    const hashedPassword = await this.hashingService.hash(password);

    await this.userRepository.changePassword(userId, { password: hashedPassword });
    await this.redis.del(CACHE_KEYS.user(userId));

    return true;
  }
}
