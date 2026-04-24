import { CACHE_KEYS, CACHE_TTL } from '@/application/common/constants/cache.constant';
import { RedisPort } from '@/application/ports/redis.port';
import { UserFullProps, UserSafeProps } from '@/domain/entities/user/user.type';
import { UserRepositoryPort } from '@/domain/repositories/user/user.repository';

export interface IUserService {
  findUserById(userId: string, options: { querySafe: true }): Promise<UserSafeProps | null>;
  findUserById(userId: string, options?: { querySafe: false }): Promise<UserFullProps | null>;
  findUserById(userId: string, options?: { querySafe?: boolean }): Promise<UserFullProps | null>;

  findUserByUsername(username: string, options: { querySafe: true }): Promise<UserSafeProps | null>;
  findUserByUsername(username: string, options?: { querySafe: false }): Promise<UserFullProps | null>;
  findUserByUsername(username: string, options?: { querySafe?: boolean }): Promise<UserFullProps | null>;

  findUserByEmail(email: string, options: { querySafe: true }): Promise<UserSafeProps | null>;
  findUserByEmail(email: string, options?: { querySafe: false }): Promise<UserFullProps | null>;
  findUserByEmail(email: string, options?: { querySafe?: boolean }): Promise<UserFullProps | null>;
}

export class UserService implements IUserService {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly redis: RedisPort
  ) {}

  async findUserById(userId: string, options: { querySafe: true }): Promise<UserSafeProps | null>;
  async findUserById(userId: string, options?: { querySafe: false }): Promise<UserFullProps | null>;
  async findUserById(userId: string, options?: { querySafe?: boolean }): Promise<UserFullProps | null> {
    const user = await this.redis.getOrSet(
      CACHE_KEYS.user(userId),
      () =>
        options?.querySafe ? this.userRepository.findSafeUserById(userId) : this.userRepository.findUserById(userId),
      CACHE_TTL.USER
    );
    if (!user) return null;
    return user.toObject();
  }

  async findUserByUsername(username: string, options?: { querySafe: true }): Promise<UserSafeProps | null>;
  async findUserByUsername(username: string, options?: { querySafe: false }): Promise<UserFullProps | null>;
  async findUserByUsername(username: string, options?: { querySafe?: boolean }): Promise<UserFullProps | null> {
    const user = await this.redis.getOrSet(
      CACHE_KEYS.userByUsername(username),
      () =>
        options?.querySafe
          ? this.userRepository.findSafeUserByUsername(username)
          : this.userRepository.findUserByUsername(username),
      CACHE_TTL.USER
    );
    if (!user) return null;
    return user.toObject();
  }

  async findUserByEmail(email: string, options?: { querySafe: true }): Promise<UserSafeProps | null>;
  async findUserByEmail(email: string, options?: { querySafe: false }): Promise<UserFullProps | null>;
  async findUserByEmail(email: string, options?: { querySafe?: boolean }): Promise<UserFullProps | null> {
    const user = options?.querySafe
      ? await this.userRepository.findSafeUserByEmail(email)
      : await this.userRepository.findUserByEmail(email);
    if (!user) return null;
    return user.toObject();
  }
}
