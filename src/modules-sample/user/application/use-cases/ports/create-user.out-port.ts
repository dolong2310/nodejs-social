import type { UserEntity } from '@/modules/user/domain/entities/user.entity';

export abstract class CreateUserOutPort {
  abstract insert(user: UserEntity): Promise<UserEntity>;
}
