import {
  CACHE_KEYS as ROLE_CACHE_KEYS,
  CACHE_TTL as ROLE_CACHE_TTL
} from '@/modules/authorization/application/constants/cache.constants';
import { PermissionFullProps } from '@/modules/authorization/domain/entities/permission.type';
import { RoleQueryRepositoryPort } from '@/modules/authorization/domain/repositories/role.query.repository';
import { RoleWithPermissions } from '@/modules/authorization/domain/repositories/role.query.type';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import {
  CacheWarmupJobData,
  CacheWarmupJobResult,
  CacheWarmupTarget
} from '@/modules/operations/application/ports/cache-warmup-job.port';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import {
  CACHE_KEYS as RELATIONSHIP_CACHE_KEYS,
  CACHE_TTL as RELATIONSHIP_CACHE_TTL
} from '@/modules/relationship/application/constants/cache.constants';
import { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';
import {
  CACHE_KEYS as USER_CACHE_KEYS,
  CACHE_TTL as USER_CACHE_TTL
} from '@/modules/user/application/constants/cache.constants';
import { EnumUserStatus, UserSafeProps } from '@/modules/user/domain/entities/user.type';
import { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { keyBy } from 'lodash-es';

type CacheHit<T> = {
  type: 'hit';
  value: T;
};

type CachedRole = RoleWithPermissions & {
  permissionsMap: Record<string, PermissionFullProps>;
};

const DEFAULT_TARGETS: CacheWarmupTarget[] = ['roles', 'friend-graphs'];
const DEFAULT_HOT_USER_LIMIT = 500;
const MAX_HOT_USER_LIMIT = 2000;

export class WarmRedisCacheUseCase {
  constructor(
    private readonly cacheManager: CacheManagerPort,
    private readonly roleRepository: RoleRepositoryPort,
    private readonly roleQueryRepository: RoleQueryRepositoryPort,
    private readonly userRepository: UserRepositoryPort,
    private readonly userQueryRepository: UserQueryRepositoryPort,
    private readonly friendshipRepository: FriendshipRepositoryPort
  ) {}

  async execute(data: CacheWarmupJobData = {}): Promise<CacheWarmupJobResult> {
    const targets = data.targets?.length ? data.targets : DEFAULT_TARGETS;
    const hotUserLimit = this.normalizeHotUserLimit(data.hotUserLimit);

    let roles = 0;
    let users = 0;
    let friendGraphs = 0;
    let hotUserIds: string[] | null = null;

    if (targets.includes('roles')) {
      roles = await this.warmRoles();
    }

    if (targets.includes('hot-users')) {
      const result = await this.warmHotUsers(hotUserLimit);
      users = result.users;
      hotUserIds = result.userIds;
    }

    if (targets.includes('friend-graphs')) {
      hotUserIds ??= await this.findHotUserIds(hotUserLimit);
      friendGraphs = await this.warmFriendGraphs(hotUserIds);
    }

    return {
      warmed: {
        roles,
        users,
        friendGraphs
      }
    };
  }

  private async warmRoles(): Promise<number> {
    const roles = await this.roleRepository.findAll();
    let warmed = 0;

    for (const role of roles) {
      const roleObject = role.toObject();
      if (!roleObject.isActive) continue;

      const roleWithPermissions = await this.roleQueryRepository.findRoleWithPermissionsById(roleObject.id);
      if (!roleWithPermissions) continue;

      const permissionsMap = keyBy(
        roleWithPermissions.permissions,
        (permission) => `${permission.method}-${permission.path}`
      );
      await this.cacheManager.set<CacheHit<CachedRole>>(
        ROLE_CACHE_KEYS.role(roleObject.id),
        {
          type: 'hit',
          value: {
            ...roleWithPermissions,
            permissionsMap
          }
        },
        { ttlSeconds: ROLE_CACHE_TTL.ROLE }
      );
      warmed += 1;
    }

    return warmed;
  }

  private async warmHotUsers(limit: number): Promise<{ users: number; userIds: string[] }> {
    const userIds = await this.findHotUserIds(limit);
    let warmed = 0;

    for (const userId of userIds) {
      const safeUser = await this.userQueryRepository.findSafeUserById(userId);
      if (!safeUser || safeUser.status !== EnumUserStatus.ACTIVE) continue;

      await this.cacheManager.set<CacheHit<UserSafeProps>>(
        USER_CACHE_KEYS.user(safeUser.id),
        { type: 'hit', value: safeUser },
        { ttlSeconds: USER_CACHE_TTL.USER }
      );

      if (safeUser.username) {
        await this.cacheManager.set<CacheHit<UserSafeProps>>(
          USER_CACHE_KEYS.userByUsername(safeUser.username),
          { type: 'hit', value: safeUser },
          { ttlSeconds: USER_CACHE_TTL.USER }
        );
      }

      warmed += 1;
    }

    return { users: warmed, userIds };
  }

  private async warmFriendGraphs(userIds: string[]): Promise<number> {
    let warmed = 0;

    for (const userId of userIds) {
      const friendIds = await this.friendshipRepository.findFriendIdsByUserId(userId);
      await this.cacheManager.set<CacheHit<string[]>>(
        RELATIONSHIP_CACHE_KEYS.friends(userId),
        { type: 'hit', value: friendIds },
        { ttlSeconds: RELATIONSHIP_CACHE_TTL.FRIENDS_GRAPH }
      );
      warmed += 1;
    }

    return warmed;
  }

  private async findHotUserIds(limit: number): Promise<string[]> {
    const users = await this.userRepository.findAllPaginated({
      limit,
      page: 1,
      offset: 0,
      orderBy: {
        field: 'updatedAt',
        param: 'desc'
      }
    });

    return users.data
      .map((user) => user.toObject())
      .filter((user) => user.status === EnumUserStatus.ACTIVE)
      .map((user) => user.id);
  }

  private normalizeHotUserLimit(limit: number | undefined): number {
    if (!limit) return DEFAULT_HOT_USER_LIMIT;
    return Math.min(MAX_HOT_USER_LIMIT, Math.max(1, Math.floor(limit)));
  }
}
