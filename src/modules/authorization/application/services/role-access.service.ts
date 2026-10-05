import { CACHE_KEYS, CACHE_TTL } from '@/modules/authorization/application/constants/cache.constants';
import type { EnumHttpMethod, PermissionFullProps } from '@/modules/authorization/domain/entities/permission.types';
import type { RoleQueryRepositoryPort } from '@/modules/authorization/domain/repositories/role.query.repository';
import type { RoleWithPermissions } from '@/modules/authorization/domain/repositories/role.query.types';
import type { CacheManagerPort } from '@/modules/core/application/ports/cache-manager.port';
import { keyBy } from 'lodash-es';
import type { Prettify } from 'ts-essentials';

/** A role with its permissions indexed by `permissionKey`, as stored in the role cache. */
export type RoleAccess = Prettify<RoleWithPermissions & { permissionsMap: Record<string, PermissionFullProps> }>;

/** A permission is identified by the HTTP method and the route path it grants. */
export function permissionKey(method: EnumHttpMethod | string, path: string): string {
  return `${method}-${path}`;
}

export interface RoleAccessServicePort {
  /** The role and its permissions, read through the role cache. Null when the role does not exist. */
  getRoleAccess(roleId: string): Promise<RoleAccess | null>;
  /** Reloads the role from the database into the role cache. Returns false when the role does not exist. */
  warmRoleAccess(roleId: string): Promise<boolean>;
}

/** Single owner of the role cache entry format, shared by authorization checks and cache warm-up. */
export class RoleAccessService implements RoleAccessServicePort {
  constructor(
    private readonly roleQueryRepository: RoleQueryRepositoryPort,
    private readonly cache: CacheManagerPort
  ) {}

  getRoleAccess(roleId: string): Promise<RoleAccess | null> {
    return this.cache.read<RoleAccess>(CACHE_KEYS.role(roleId), () => this.loadRoleAccess(roleId), {
      ttlSeconds: CACHE_TTL.ROLE
    });
  }

  async warmRoleAccess(roleId: string): Promise<boolean> {
    const roleAccess = await this.loadRoleAccess(roleId);
    if (!roleAccess) return false;
    await this.cache.write(CACHE_KEYS.role(roleId), async () => roleAccess, { ttlSeconds: CACHE_TTL.ROLE });
    return true;
  }

  private async loadRoleAccess(roleId: string): Promise<RoleAccess | null> {
    const role = await this.roleQueryRepository.findRoleWithPermissionsById(roleId);
    if (!role) return null;
    // Index by method and path so an access check is a single object lookup.
    const permissionsMap = keyBy(role.permissions, (permission) => permissionKey(permission.method, permission.path));
    return { ...role, permissionsMap };
  }
}
