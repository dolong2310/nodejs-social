import { CACHE_KEYS, CACHE_TTL } from '@/constants';
import { Injectable } from '@/decorators';
import { BaseService, IUser, UpdateMeRequestDTO, UserRepository, UserResponseDTO } from '@/modules';
import { RedisService } from '@/providers';

export interface IUsersService {
  findUserByEmail(email: string): Promise<IUser | null>;
  findUserById(userId: string): Promise<IUser | null>;
  findUserByUsername(username: string): Promise<IUser | null>;
  getMe(userId: string): Promise<UserResponseDTO | null>;
  updateMe(userId: string, body: UpdateMeRequestDTO): Promise<UserResponseDTO | null>;
  getUserProfile(username: string): Promise<UserResponseDTO | null>;
  invalidateUserCache(userId: string): Promise<void>;
}

@Injectable()
export class UsersService extends BaseService implements IUsersService {
  constructor(
    private readonly userRepository: UserRepository,
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
    return this.userRepository.findByUsername(username);
  }

  getMe(userId: string): Promise<UserResponseDTO | null> {
    return this.userRepository.findById<UserResponseDTO>(userId, {
      projection: {
        password: 0,
        emailVerificationToken: 0,
        forgotPasswordToken: 0
      }
    });
  }

  async updateMe(userId: string, body: UpdateMeRequestDTO): Promise<UserResponseDTO | null> {
    const updated = await this.userRepository.findOneAndUpdate(userId, body, {
      returnDocument: 'after',
      projection: {
        password: 0,
        emailVerificationToken: 0,
        forgotPasswordToken: 0
      }
    });
    await this.invalidateUserCache(userId);
    return updated ? new UserResponseDTO(updated) : null;
  }

  getUserProfile(username: string): Promise<UserResponseDTO | null> {
    return this.userRepository.findByUsername<UserResponseDTO>(username, {
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
