import { CACHE_KEYS, CACHE_TTL } from '@/constants/cache.constant';
import { Injectable } from '@/decorators/injectable.decorator';
import { BaseService } from '@/modules/base/base.service';
import { UpdateMeRequestDTO } from '@/modules/users/dtos/users.request.dto';
import { UserResponseDTO } from '@/modules/users/dtos/users.response.dto';
import { UserRepository } from '@/modules/users/users.repository';
import { IUser } from '@/modules/users/users.schema';
import { RedisService } from '@/providers/database/redis/redis.service';
import { FindOneOptions } from 'mongodb';

export interface IUsersService {
  findUserByEmail(email: string, options?: FindOneOptions): Promise<IUser | null>;
  findUserById(userId: string): Promise<IUser | null>;
  findUserByUsername(username: string): Promise<IUser | null>;
  getMe(userId: string): Promise<UserResponseDTO | null>;
  updateMe(userId: string, body: UpdateMeRequestDTO): Promise<UserResponseDTO | null>;
  getUserProfile(username: string): Promise<UserResponseDTO | null>;
  invalidateUserCache(userId: string, usernames?: string[]): Promise<void>;
}

@Injectable()
export class UsersService extends BaseService implements IUsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly redisService: RedisService
  ) {
    super();
  }

  findUserByEmail(email: string, options?: FindOneOptions): Promise<IUser | null> {
    return this.userRepository.findByEmail(email, options);
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

  async getMe(userId: string): Promise<UserResponseDTO | null> {
    const user = await this.findUserById(userId);
    return user ? new UserResponseDTO(user) : null;
  }

  async updateMe(userId: string, body: UpdateMeRequestDTO): Promise<UserResponseDTO | null> {
    const current = await this.findUserById(userId);
    const updated = await this.userRepository.findOneAndUpdate(userId, body, {
      returnDocument: 'after',
      projection: {
        password: 0,
        emailVerificationToken: 0,
        forgotPasswordToken: 0
      }
    });
    const usernames = [current?.username, updated?.username].filter((username): username is string =>
      Boolean(username)
    );
    await this.invalidateUserCache(userId, usernames);
    return updated ? new UserResponseDTO(updated) : null;
  }

  async getUserProfile(username: string): Promise<UserResponseDTO | null> {
    const user = await this.findUserByUsername(username);
    return user ? new UserResponseDTO(user) : null;
  }

  async invalidateUserCache(userId: string, usernames: string[] = []): Promise<void> {
    const keys = [CACHE_KEYS.user(userId), ...usernames.map((username) => CACHE_KEYS.userByUsername(username))];
    await this.redisService.del(...new Set(keys));
  }
}
