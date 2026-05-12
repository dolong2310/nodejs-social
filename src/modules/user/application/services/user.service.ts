import { CacheStrategyPort } from '@/modules/core/application/ports/cache-strategy.port';
import { CACHE_KEYS, CACHE_TTL } from '@/modules/user/application/constants/cache.constant';
import { UserFullProps, UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { normalizeUserEmail, normalizeUsername } from '@/modules/user/domain/helpers/user-normalization.helper';
import { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export interface UserServicePort {
  findUserById(userId: string, options: { querySafe: true }): Promise<UserSafeProps | null>;
  findUserById(userId: string, options?: { querySafe: false }): Promise<UserFullProps | null>;
  findUserById(userId: string, options?: { querySafe?: boolean }): Promise<UserSafeProps | UserFullProps | null>;

  findUserByUsername(username: string, options: { querySafe: true }): Promise<UserSafeProps | null>;
  findUserByUsername(username: string, options?: { querySafe: false }): Promise<UserFullProps | null>;
  findUserByUsername(
    username: string,
    options?: { querySafe?: boolean }
  ): Promise<UserSafeProps | UserFullProps | null>;

  findUserByEmail(email: string, options: { querySafe: true }): Promise<UserSafeProps | null>;
  findUserByEmail(email: string, options?: { querySafe: false }): Promise<UserFullProps | null>;
  findUserByEmail(email: string, options?: { querySafe?: boolean }): Promise<UserSafeProps | UserFullProps | null>;
}

export class UserService implements UserServicePort {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly userQueryRepository: UserQueryRepositoryPort,
    private readonly cache: CacheStrategyPort
  ) {}

  async findUserById(userId: string, options: { querySafe: true }): Promise<UserSafeProps | null>;
  async findUserById(userId: string, options?: { querySafe: false }): Promise<UserFullProps | null>;
  async findUserById(userId: string, options?: { querySafe?: boolean }): Promise<UserSafeProps | UserFullProps | null> {
    const user = await this.cache.get(
      CACHE_KEYS.user(userId),
      () =>
        options?.querySafe
          ? this.userQueryRepository.findSafeUserById(userId)
          : this.userRepository.findUserById(userId).then((user) => user?.toObject() ?? null),
      {
        ttlSeconds: CACHE_TTL.USER
      }
    );
    if (!user) return null;
    return user;
  }

  async findUserByUsername(username: string, options?: { querySafe: true }): Promise<UserSafeProps | null>;
  async findUserByUsername(username: string, options?: { querySafe: false }): Promise<UserFullProps | null>;
  async findUserByUsername(
    username: string,
    options?: { querySafe?: boolean }
  ): Promise<UserSafeProps | UserFullProps | null> {
    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername) return null;

    const user = await this.cache.get(
      CACHE_KEYS.userByUsername(normalizedUsername),
      () =>
        options?.querySafe
          ? this.userQueryRepository.findSafeUserByUsername(normalizedUsername)
          : this.userRepository.findUserByUsername(normalizedUsername).then((user) => user?.toObject() ?? null),
      { ttlSeconds: CACHE_TTL.USER }
    );
    if (!user) return null;
    return user;
  }

  async findUserByEmail(email: string, options?: { querySafe: true }): Promise<UserSafeProps | null>;
  async findUserByEmail(email: string, options?: { querySafe: false }): Promise<UserFullProps | null>;
  async findUserByEmail(
    email: string,
    options?: { querySafe?: boolean }
  ): Promise<UserSafeProps | UserFullProps | null> {
    const normalizedEmail = normalizeUserEmail(email);
    const user = options?.querySafe
      ? await this.userQueryRepository.findSafeUserByEmail(normalizedEmail)
      : await this.userRepository.findUserByEmail(normalizedEmail).then((user) => user?.toObject() ?? null);
    if (!user) return null;
    return user;
  }
}
