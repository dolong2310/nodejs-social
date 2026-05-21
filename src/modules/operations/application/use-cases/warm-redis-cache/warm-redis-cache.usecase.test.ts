import {
  CACHE_KEYS as ROLE_CACHE_KEYS,
  CACHE_TTL as ROLE_CACHE_TTL
} from '@/modules/authorization/application/constants/cache.constant';
import { EnumHttpMethod, PermissionFullProps } from '@/modules/authorization/domain/entities/permission.type';
import { RoleQueryRepositoryPort } from '@/modules/authorization/domain/repositories/role.query.repository';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { Paginated } from '@/modules/core/domain/repositories/port.repository';
import { WarmRedisCacheUseCase } from '@/modules/operations/application/use-cases/warm-redis-cache/warm-redis-cache.usecase';
import {
  CACHE_KEYS as RELATIONSHIP_CACHE_KEYS,
  CACHE_TTL as RELATIONSHIP_CACHE_TTL
} from '@/modules/relationship/application/constants/cache.constant';
import { FriendshipRepositoryPort } from '@/modules/relationship/domain/repositories/friendship.repository';
import {
  CACHE_KEYS as USER_CACHE_KEYS,
  CACHE_TTL as USER_CACHE_TTL
} from '@/modules/user/application/constants/cache.constant';
import { UserEntity } from '@/modules/user/domain/entities/user.entity';
import { UserQueryRepositoryPort } from '@/modules/user/domain/repositories/user.query.repository';
import { UserRepositoryPort } from '@/modules/user/domain/repositories/user.repository';
import { RoleEntity } from '@/modules/authorization/domain/entities/role.entity';
import { makeRoleFullProps } from '@test/support/builders/role.builder';
import { makeUserFullProps, makeUserSafeProps } from '@test/support/builders/user.builder';
import { entityDouble } from '@test/support/doubles/entity.double';
import { mockPort } from '@test/support/mocks/port.mock';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const now = new Date('2026-01-01T00:00:00.000Z');
const role = makeRoleFullProps({ id: 'role_user' });
const user = makeUserFullProps({ id: 'user_1', username: 'longdo' });
const safeUser = makeUserSafeProps(user);
const permission: PermissionFullProps = {
  id: 'permission_1',
  name: 'Read feed',
  description: '',
  method: EnumHttpMethod.GET,
  path: '/api/v1/posts',
  module: 'post',
  createdAt: now,
  createdById: null,
  updatedAt: now,
  updatedById: null,
  deletedAt: null,
  deletedById: null
};

describe('WarmRedisCacheUseCase', () => {
  let cacheManager: CacheManagerPort;
  let roleRepository: RoleRepositoryPort;
  let roleQueryRepository: RoleQueryRepositoryPort;
  let userRepository: UserRepositoryPort;
  let userQueryRepository: UserQueryRepositoryPort;
  let friendshipRepository: FriendshipRepositoryPort;

  beforeEach(() => {
    cacheManager = mockPort<CacheManagerPort>({
      set: vi.fn().mockResolvedValue(undefined)
    });
    roleRepository = mockPort<RoleRepositoryPort>({
      findAll: vi.fn().mockResolvedValue([entityDouble(role) as unknown as RoleEntity])
    });
    const { permissionIds, ...roleWithoutPermissionIds } = role;
    void permissionIds;
    roleQueryRepository = mockPort<RoleQueryRepositoryPort>({
      findRoleWithPermissionsById: vi.fn().mockResolvedValue({
        ...roleWithoutPermissionIds,
        permissions: [permission]
      })
    });
    userRepository = mockPort<UserRepositoryPort>({
      findAllPaginated: vi.fn().mockResolvedValue(
        new Paginated({
          count: 1,
          page: 1,
          limit: 500,
          data: [entityDouble(user) as unknown as UserEntity]
        })
      )
    });
    userQueryRepository = mockPort<UserQueryRepositoryPort>({
      findSafeUserById: vi.fn().mockResolvedValue(safeUser)
    });
    friendshipRepository = mockPort<FriendshipRepositoryPort>({
      findFriendIdsByUserId: vi.fn().mockResolvedValue(['friend_1'])
    });
  });

  it('warms roles and friend graphs by default', async () => {
    const useCase = buildUseCase();

    const result = await useCase.execute();

    expect(result.warmed).toEqual({ roles: 1, users: 0, friendGraphs: 1 });
    expect(cacheManager.set).toHaveBeenCalledWith(
      ROLE_CACHE_KEYS.role(role.id),
      {
        type: 'hit',
        value: expect.objectContaining({
          id: role.id,
          permissionsMap: {
            [`${permission.method}-${permission.path}`]: permission
          }
        })
      },
      { ttlSeconds: ROLE_CACHE_TTL.ROLE }
    );
    expect(cacheManager.set).toHaveBeenCalledWith(
      RELATIONSHIP_CACHE_KEYS.friends(user.id),
      { type: 'hit', value: ['friend_1'] },
      { ttlSeconds: RELATIONSHIP_CACHE_TTL.FRIENDS_GRAPH }
    );
    expect(cacheManager.set).not.toHaveBeenCalledWith(
      USER_CACHE_KEYS.user(user.id),
      expect.anything(),
      expect.anything()
    );
  });

  it('can warm safe hot-user profile cache when requested explicitly', async () => {
    const useCase = buildUseCase();

    const result = await useCase.execute({ targets: ['hot-users'] });

    expect(result.warmed).toEqual({ roles: 0, users: 1, friendGraphs: 0 });
    expect(cacheManager.set).toHaveBeenCalledWith(
      USER_CACHE_KEYS.user(safeUser.id),
      { type: 'hit', value: safeUser },
      { ttlSeconds: USER_CACHE_TTL.USER }
    );
    expect(cacheManager.set).toHaveBeenCalledWith(
      USER_CACHE_KEYS.userByUsername(safeUser.username ?? ''),
      { type: 'hit', value: safeUser },
      { ttlSeconds: USER_CACHE_TTL.USER }
    );
  });

  function buildUseCase(): WarmRedisCacheUseCase {
    return new WarmRedisCacheUseCase(
      cacheManager,
      roleRepository,
      roleQueryRepository,
      userRepository,
      userQueryRepository,
      friendshipRepository
    );
  }
});
