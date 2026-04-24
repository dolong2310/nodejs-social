import { CACHE_KEYS } from '@/application/common/constants/cache.constant';
import { UserNotFoundException } from '@/application/exceptions/user.exception';
import { RedisPort } from '@/application/ports/redis.port';
import { IUserService } from '@/application/services/user/user.service';
import {
  UpdateMeCommand,
  UpdateMeInPort,
  UpdateMeResult
} from '@/application/use-cases/user/update-me/update-me.in-port';
import { UserRepositoryPort } from '@/domain/repositories/user/user.repository';

export class UpdateMeInteractor extends UpdateMeInPort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly userService: IUserService,
    private readonly redis: RedisPort
  ) {
    super();
  }

  async execute({
    userId,
    name,
    birthday,
    bio,
    location,
    website,
    username,
    avatar,
    coverPhoto
  }: UpdateMeCommand): Promise<UpdateMeResult> {
    const current = await this.userService.findUserById(userId);
    const userEntity = await this.userRepository.updateMe(userId, {
      name: name ?? current?.name ?? '',
      birthday: birthday ?? current?.birthday ?? new Date(),
      bio: bio ?? '',
      location: location ?? '',
      website: website ?? '',
      username: username ?? '',
      avatar: avatar ?? '',
      coverPhoto: coverPhoto ?? ''
    });
    const user = userEntity?.toObject();

    if (!user) {
      throw UserNotFoundException;
    }

    const usernames = [current?.username, user?.username].filter((username): username is string => Boolean(username));
    await this.invalidateUserCache({ userId, usernames });

    return new UpdateMeResult({
      id: user.id,
      name: user.name,
      email: user.email,
      birthday: user.birthday,
      roleId: user.roleId,
      status: user.status,
      bio: user.bio,
      location: user.location,
      website: user.website,
      username: user.username,
      avatar: user.avatar,
      coverPhoto: user.coverPhoto,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    });
  }

  async invalidateUserCache({ userId, usernames }: { userId: string; usernames: string[] }): Promise<void> {
    const keys = [CACHE_KEYS.user(userId), ...usernames.map((username) => CACHE_KEYS.userByUsername(username))];
    await this.redis.del(...new Set(keys));
  }
}
