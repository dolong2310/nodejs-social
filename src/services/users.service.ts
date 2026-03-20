import { CACHE_KEYS, CACHE_TTL } from '@/constants/cache.constant';
import { IRedisService } from '@/database/redis.service';
import { IUpdateMeRequestBody } from '@/models/requests/user.request';
import { IUserResponse } from '@/models/responses/user.response';
import { IUser } from '@/models/schemas/user.schema';
import { IUserRepository } from '@/repositories/user.repository';
import { BaseService } from '@/services/base.service';

export interface IUsersService {
  findUserByEmail(email: string): Promise<IUser | null>;
  findUserById(userId: string): Promise<IUser | null>;
  findUserByUsername(username: string): Promise<IUser | null>;
  getMe(userId: string): Promise<IUserResponse | null>;
  updateMe(userId: string, body: IUpdateMeRequestBody & { dateOfBirth?: Date }): Promise<IUserResponse | null>;
  getUserProfile(username: string): Promise<IUserResponse | null>;
  invalidateUserCache(userId: string): Promise<void>;
}

class UsersService extends BaseService implements IUsersService {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly redisService: IRedisService
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
    return this.userRepository.findByUsername(username);
  }

  getMe(userId: string): Promise<IUserResponse | null> {
    return this.userRepository.findById<IUserResponse>(userId, {
      projection: {
        password: 0,
        emailVerificationToken: 0,
        forgotPasswordToken: 0
      }
    });
  }

  async updateMe(userId: string, body: IUpdateMeRequestBody & { dateOfBirth?: Date }): Promise<IUserResponse | null> {
    const updated = await this.userRepository.findOneAndUpdate<IUserResponse>(userId, body, {
      returnDocument: 'after',
      projection: {
        password: 0,
        emailVerificationToken: 0,
        forgotPasswordToken: 0
      }
    });
    await this.invalidateUserCache(userId);
    return updated;
  }

  getUserProfile(username: string): Promise<IUserResponse | null> {
    return this.userRepository.findByUsername<IUserResponse>(username, {
      projection: {
        password: 0,
        emailVerificationToken: 0,
        forgotPasswordToken: 0
      }
    });
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.redisService.del(CACHE_KEYS.user(userId));
  }
}

export default UsersService;
