import { CACHE_KEYS, CACHE_TTL } from '@/constants/cache.constant';
import { Injectable } from '@/decorators/injectable.decorator';
import { BaseService } from '@/modules/base/base.service';
import { BlockRepository } from '@/modules/blocks/blocks.repository';
import { UpdateMeRequestDTO } from '@/modules/users/dtos/users.request.dto';
import { UserResponseDTO } from '@/modules/users/dtos/users.response.dto';
import { CannotViewUserProfileBlockedException, UsersUserNotFoundException } from '@/modules/users/users.exception';
import { UserRepository } from '@/modules/users/users.repository';
import { IUser } from '@/modules/users/users.schema';
import { RedisService } from '@/providers/database/redis/redis.service';

export interface IUsersService {
  findUserByEmail(email: string): Promise<IUser | null>;
  findUserById(userId: string): Promise<IUser | null>;
  findUserByUsername(username: string): Promise<IUser | null>;
  getMe(userId: string): Promise<UserResponseDTO>;
  updateMe(userId: string, body: UpdateMeRequestDTO): Promise<UserResponseDTO>;
  getUserProfile(payload: { userId: string; username: string }): Promise<UserResponseDTO>;
  invalidateUserCache(userId: string, usernames?: string[]): Promise<void>;
}

@Injectable()
export class UsersService extends BaseService implements IUsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly blockRepository: BlockRepository,
    private readonly redisService: RedisService
  ) {
    super();
  }

  findUserByEmail(email: string): Promise<IUser | null> {
    return this.userRepository.findByEmail(email);
  }

  findUserById(userId: string): Promise<IUser | null> {
    return this.redisService.getOrSet(
      CACHE_KEYS.user(userId),
      () => this.userRepository.findById(userId),
      CACHE_TTL.USER
    );
  }

  findUserByUsername(username: string): Promise<IUser | null> {
    return this.redisService.getOrSet(
      CACHE_KEYS.userByUsername(username),
      () => this.userRepository.findByUsername(username),
      CACHE_TTL.USER
    );
  }

  async getMe(userId: string): Promise<UserResponseDTO> {
    const user = await this.findUserById(userId);

    if (!user) {
      throw UsersUserNotFoundException;
    }

    return new UserResponseDTO(user);
  }

  async updateMe(userId: string, body: UpdateMeRequestDTO): Promise<UserResponseDTO> {
    const current = await this.findUserById(userId);
    const updated = await this.userRepository.updateMe(userId, body);
    const usernames = [current?.username, updated?.username].filter((username): username is string =>
      Boolean(username)
    );
    await this.invalidateUserCache(userId, usernames);

    if (!updated) {
      throw UsersUserNotFoundException;
    }

    return new UserResponseDTO(updated);
  }

  async getUserProfile({ userId, username }: { userId: string; username: string }): Promise<UserResponseDTO> {
    const user = await this.findUserByUsername(username);

    if (!user) {
      throw UsersUserNotFoundException;
    }

    if (userId) {
      const blocked = await this.blockRepository.isBlockedEitherWay(userId, user._id.toString());
      if (blocked) {
        throw CannotViewUserProfileBlockedException;
      }
    }

    return new UserResponseDTO(user);
  }

  async invalidateUserCache(userId: string, usernames: string[] = []): Promise<void> {
    const keys = [CACHE_KEYS.user(userId), ...usernames.map((username) => CACHE_KEYS.userByUsername(username))];
    await this.redisService.del(...new Set(keys));
  }
}
