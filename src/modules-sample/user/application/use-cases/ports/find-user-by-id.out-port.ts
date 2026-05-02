import type { UserEntity } from '@/modules/user/domain/entities/user.entity';

export abstract class FindUserByIdOutPort {
  abstract findUserById(userId: string): Promise<UserEntity>;
}
