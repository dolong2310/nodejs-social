import type { UserEntity } from '@/modules/user/domain/entities/user.entity';

export abstract class GetCurrentUserOutPort {
  abstract getCurrentUser(): Promise<UserEntity>;
}
