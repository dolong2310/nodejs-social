import type {
  RoleAccess,
  RoleAccessServicePort
} from '@/modules/authorization/application/services/role-access.service';
import { CheckRouteAccessUseCase } from '@/modules/authorization/application/use-cases/check-route-access/check-route-access.usecase';
import { EnumHttpMethod, type PermissionFullProps } from '@/modules/authorization/domain/entities/permission.types';
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

function roleAccess(overrides: Partial<RoleAccess> = {}): RoleAccess {
  const { permissionIds, ...role } = makeRoleFullProps();
  void permissionIds;
  return {
    ...role,
    permissions: [permission],
    permissionsMap: { 'GET-/api/v1/posts': permission },
    ...overrides
  };
}

function setup(access: RoleAccess | null) {
  const roleAccessService: RoleAccessServicePort = {
    getRoleAccess: vi.fn().mockResolvedValue(access),
    warmRoleAccess: vi.fn()
  };
  return { roleAccessService, useCase: new CheckRouteAccessUseCase(roleAccessService) };
}

const request = { roleId: 'role_user', method: EnumHttpMethod.GET, path: '/api/v1/posts' };

describe('CheckRouteAccessUseCase', () => {
  it('returns the role without the lookup index when it holds the route permission', async () => {
    const { roleAccessService, useCase } = setup(roleAccess());

    const role = await useCase.execute(request);

    expect(roleAccessService.getRoleAccess).toHaveBeenCalledWith('role_user');
    expect(role).toMatchObject({ id: 'role_user', permissions: [permission] });
    expect(role).not.toHaveProperty('permissionsMap');
  });

  it('denies a role that does not exist', async () => {
    await expect(setup(null).useCase.execute(request)).resolves.toBeNull();
  });

  it('denies an inactive role even when it holds the permission', async () => {
    await expect(setup(roleAccess({ isActive: false })).useCase.execute(request)).resolves.toBeNull();
  });

  it('denies a route the role has no permission for', async () => {
    const { useCase } = setup(roleAccess());

    await expect(useCase.execute({ ...request, method: EnumHttpMethod.DELETE })).resolves.toBeNull();
    await expect(useCase.execute({ ...request, path: '/api/v1/posts/:id' })).resolves.toBeNull();
  });
});
