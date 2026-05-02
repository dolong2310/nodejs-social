import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { CACHE_KEYS, CACHE_TTL } from '@/modules/user/application/constants/cache.constant';
import { UserQueryRepositoryPort } from '@/modules/user/application/ports/queries/user-query.repository';
import { UserFullProps, UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';

export interface IUserService {
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

export class UserService implements IUserService {
  constructor(
    private readonly userRepository: UserRepositoryPort,
    private readonly userQueryRepository: UserQueryRepositoryPort,
    private readonly cacheManager: CacheManagerPort
  ) {}

  async findUserById(userId: string, options: { querySafe: true }): Promise<UserSafeProps | null>;
  async findUserById(userId: string, options?: { querySafe: false }): Promise<UserFullProps | null>;
  async findUserById(userId: string, options?: { querySafe?: boolean }): Promise<UserSafeProps | UserFullProps | null> {
    const user = await this.cacheManager.getOrSet(
      CACHE_KEYS.user(userId),
      () =>
        options?.querySafe
          ? this.userQueryRepository.findSafeUserById(userId)
          : this.userRepository.findUserById(userId).then((user) => user?.toObject() ?? null),
      CACHE_TTL.USER
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
    const user = await this.cacheManager.getOrSet(
      CACHE_KEYS.userByUsername(username),
      () =>
        options?.querySafe
          ? this.userQueryRepository.findSafeUserByUsername(username)
          : this.userRepository.findUserByUsername(username).then((user) => user?.toObject() ?? null),
      CACHE_TTL.USER
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
    const user = options?.querySafe
      ? await this.userQueryRepository.findSafeUserByEmail(email)
      : await this.userRepository.findUserByEmail(email).then((user) => user?.toObject() ?? null);
    if (!user) return null;
    return user;
  }
}
