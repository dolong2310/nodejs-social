import type { UserEntity } from '@/modules/user/domain/entities/user.entity';

export abstract class FindUserByNicknameOutPort {
  abstract findUserByNickname(nickname: string): Promise<UserEntity>;
}
