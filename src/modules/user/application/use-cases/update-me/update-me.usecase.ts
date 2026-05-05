import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { CACHE_KEYS } from '@/modules/user/application/constants/cache.constant';
import { UserServicePort } from '@/modules/user/application/services/user.service';
import {
  UpdateMeCommand,
  UpdateMePort,
  UpdateMeResult
} from '@/modules/user/application/use-cases/update-me/update-me.port';
import { UsernameAlreadyExistsException, UserNotFoundException } from '@/modules/user/application/user.exception';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export class UpdateMeUseCase extends UpdateMePort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly userService: UserServicePort,
    private readonly cacheManager: CacheManagerPort
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

    if (username) {
      const existingUser = await this.userService.findUserByUsername(username, { querySafe: true });
      if (existingUser && existingUser.id !== userId) {
        throw new UsernameAlreadyExistsException();
      }
    }

    const userEntity = await this.userRepository.updateMe(userId, {
      name: name ?? current?.name ?? '',
      birthday: new Date(birthday ?? current?.birthday ?? new Date()),
      bio: bio ?? '',
      location: location ?? '',
      website: website ?? '',
      username: username ?? '',
      avatar: avatar ?? '',
      coverPhoto: coverPhoto ?? ''
    });
    const user = userEntity?.toObject();

    if (!user) {
      throw new UserNotFoundException();
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
    await this.cacheManager.del(...new Set(keys));
  }
}
