import { IBlockRepository } from '@/domain/repositories/block/block.repository';
import { IUserRepository } from '@/domain/repositories/user/user.repository';

import { CACHE_KEYS, CACHE_TTL } from '@/application/common/constants/cache.constant';
import {
  FindUserByEmailPayloadDTO,
  FindUserByIdPayloadDTO,
  FindUserByUsernamePayloadDTO,
  GetMePayloadDTO,
  GetUserProfilePayloadDTO,
  InvalidateUserCachePayloadDTO,
  UpdateMePayloadDTO
} from '@/application/dtos/user/user.payload.dto';
import { UserResultDTO } from '@/application/dtos/user/user.result.dto';
import { CannotViewUserProfileBlockedException, UsersUserNotFoundException } from '@/application/errors/user.error';
import { IRedisService } from '@/application/ports/redis.port';
import { IUsersService } from '@/application/ports/user.port';
import { BaseService } from '@/application/use-cases/base.service';

export class UsersService extends BaseService implements IUsersService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly blockRepository: IBlockRepository,
    private readonly redisService: IRedisService
  ) {
    super();
  }

  async findUserByEmail({ email }: FindUserByEmailPayloadDTO): Promise<UserResultDTO | null> {
    const user = await this.userRepository.findUserByEmail({ email });
    return user ? new UserResultDTO(user) : null;
  }

  async findUserById({ userId }: FindUserByIdPayloadDTO): Promise<UserResultDTO | null> {
    const user = await this.redisService.getOrSet(
      CACHE_KEYS.user(userId),
      () => this.userRepository.findUserById({ id: userId }),
      CACHE_TTL.USER
    );
    return user ? new UserResultDTO(user) : null;
  }

  async findUserByUsername({ username }: FindUserByUsernamePayloadDTO): Promise<UserResultDTO | null> {
    const user = await this.redisService.getOrSet(
      CACHE_KEYS.userByUsername(username),
      () => this.userRepository.findUserByUsername({ username }),
      CACHE_TTL.USER
    );
    return user ? new UserResultDTO(user) : null;
  }

  async getMe({ userId }: GetMePayloadDTO): Promise<UserResultDTO> {
    const user = await this.findUserById({ userId });

    if (!user) {
      throw UsersUserNotFoundException;
    }

    return user;
  }

  async updateMe({
    userId,
    name,
    dateOfBirth,
    bio,
    location,
    website,
    username,
    avatar,
    coverPhoto
  }: UpdateMePayloadDTO): Promise<UserResultDTO> {
    const current = await this.findUserById({ userId });
    const updated = await this.userRepository.updateMe({
      id: userId,
      name: name ?? current?.name ?? '',
      dateOfBirth: dateOfBirth ?? current?.dateOfBirth ?? new Date(),
      bio: bio ?? '',
      location: location ?? '',
      website: website ?? '',
      username: username ?? '',
      avatar: avatar ?? '',
      coverPhoto: coverPhoto ?? ''
    });
    const usernames = [current?.username, updated?.username].filter((username): username is string =>
      Boolean(username)
    );
    await this.invalidateUserCache({ userId, usernames });

    if (!updated) {
      throw UsersUserNotFoundException;
    }

    return new UserResultDTO(updated);
  }

  async getUserProfile({ userId, username }: GetUserProfilePayloadDTO): Promise<UserResultDTO> {
    const user = await this.findUserByUsername({ username });

    if (!user) {
      throw UsersUserNotFoundException;
    }

    if (userId) {
      const blocked = await this.blockRepository.isBlockedEitherWay({ aUserId: userId, bUserId: user.id });
      if (blocked) {
        throw CannotViewUserProfileBlockedException;
      }
    }

    return user;
  }

  async invalidateUserCache({ userId, usernames }: InvalidateUserCachePayloadDTO): Promise<void> {
    const keys = [CACHE_KEYS.user(userId), ...usernames.map((username) => CACHE_KEYS.userByUsername(username))];
    await this.redisService.del(...new Set(keys));
  }
}
