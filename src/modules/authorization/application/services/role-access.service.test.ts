import { CacheManager } from '@/infrastructure/persistence/redis/cache-manager';
import type { RedisClientPort } from '@/infrastructure/persistence/redis/redis-client';
import { RoleAccessService } from '@/modules/authorization/application/services/role-access.service';
import { CheckRouteAccessUseCase } from '@/modules/authorization/application/use-cases/check-route-access/check-route-access.usecase';
import { EnumHttpMethod, type PermissionFullProps } from '@/modules/authorization/domain/entities/permission.types';
import type { RoleQueryRepositoryPort } from '@/modules/authorization/domain/repositories/role.query.repository';
import type { RoleWithPermissions } from '@/modules/authorization/domain/repositories/role.query.types';
import { makeRoleFullProps } from '@test/support/builders/role.builder';
import { describe, expect, it, vi } from 'vitest';

const now = new Date('2026-01-01T00:00:00.000Z');
const permission: PermissionFullProps = {
  id: 'permission_1',
  name: 'Read feed',
  description: '',
  method: EnumHttpMethod.GET,
  path: '/api/v1/posts',
  module: 'POSTS',
  createdAt: now,
  createdById: null,
  updatedAt: now,
  updatedById: null,
  deletedAt: null,
  deletedById: null
};

function roleWithPermissions(): RoleWithPermissions {
  const { permissionIds, ...role } = makeRoleFullProps();
  void permissionIds;
  return { ...role, permissions: [permission] };
}

// The real CacheManager over an in-memory Redis stand-in, so the stored cache entry format is the production one.
function setup() {
  const store = new Map<string, string>();
  const redis = {
    client: {
      get: async (key: string) => store.get(key) ?? null,
      set: async (key: string, value: string) => {
        store.set(key, value);
        return 'OK';
      },
      eval: async () => 1
    }
  } as unknown as RedisClientPort;
  const roleQueryRepository: RoleQueryRepositoryPort = {
    findRoleWithPermissionsById: vi.fn(async (id: string) => (id === 'role_user' ? roleWithPermissions() : null))
  } as unknown as RoleQueryRepositoryPort;
  const roleAccessService = new RoleAccessService(roleQueryRepository, new CacheManager(redis));
  return { store, roleQueryRepository, roleAccessService };
}

describe('RoleAccessService', () => {
  it('serves an access check from the entry written by cache warm-up', async () => {
    const { roleQueryRepository, roleAccessService } = setup();
    const checkRouteAccess = new CheckRouteAccessUseCase(roleAccessService);

    await expect(roleAccessService.warmRoleAccess('role_user')).resolves.toBe(true);
    vi.mocked(roleQueryRepository.findRoleWithPermissionsById).mockClear();

    const role = await checkRouteAccess.execute({
      roleId: 'role_user',
      method: EnumHttpMethod.GET,
      path: '/api/v1/posts'
    });

    expect(role).toMatchObject({ id: 'role_user' });
    expect(roleQueryRepository.findRoleWithPermissionsById).not.toHaveBeenCalled();
  });

  it('loads and caches the role on a cache miss', async () => {
    const { store, roleQueryRepository, roleAccessService } = setup();

    await roleAccessService.getRoleAccess('role_user');
    const cached = await roleAccessService.getRoleAccess('role_user');

    expect(roleQueryRepository.findRoleWithPermissionsById).toHaveBeenCalledOnce();
    expect(cached?.permissionsMap['GET-/api/v1/posts']).toEqual(permission);
    expect(store.has('role:role_user')).toBe(true);
  });

  it('does not warm a role that does not exist', async () => {
    const { store, roleAccessService } = setup();

    await expect(roleAccessService.warmRoleAccess('role_missing')).resolves.toBe(false);
    expect(store.size).toBe(0);
  });
});
