import { PermissionFullProps } from '@/modules/authorization/domain/entities/permission.type';
import { EnumRoleName } from '@/modules/authorization/domain/entities/role.type';
import { PermissionRepositoryPort } from '@/modules/authorization/domain/repositories/permission.repository';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';
import {
  AvailableRoute,
  RoutePermissionCatalogPort
} from '@/modules/operations/application/ports/route-permission-catalog.port';
import {
  RolePermissionSyncResult,
  SyncRolePermissionsPort
} from '@/modules/operations/application/use-cases/sync-role-permissions/sync-role-permissions.port';

const USER_GETS_ALL_PERMISSIONS = false;

const USER_MODULE_ALLOWLIST: ReadonlySet<string> = new Set([
  'AUTH',
  'USERS',
  'MEDIA',
  'OAUTH',
  'POSTS',
  'SEARCH',
  'FRIENDS',
  'BLOCKS',
  'CONVERSATIONS',
  'STATIC',
  'NOTIFICATIONS'
]);

export class SyncRolePermissionsUseCase extends SyncRolePermissionsPort {
  constructor(
    private readonly permissionRepository: PermissionRepositoryPort,
    private readonly roleRepository: RoleRepositoryPort,
    private readonly routeCatalog: RoutePermissionCatalogPort
  ) {
    super();
  }

  async execute(): Promise<RolePermissionSyncResult> {
    const availableRoutes = this.routeCatalog.getAvailableRoutes();
    await this.ensureBaseRoles();
    const syncStats = await this.syncPermissions(availableRoutes);

    const permissions = await this.permissionRepository.findPermissions({
      limit: 9999,
      skip: 0
    });

    const allPermissionIds = permissions.map((permission) => permission.id.toString());
    const userPermissionIds = USER_GETS_ALL_PERMISSIONS
      ? allPermissionIds
      : permissions
          .filter((permission) => USER_MODULE_ALLOWLIST.has(permission.getProps().module))
          .map((permission) => permission.id.toString());

    await Promise.all([
      allPermissionIds.length > 0
        ? this.syncPermissionsToRole(EnumRoleName.ADMIN, allPermissionIds)
        : Promise.resolve(),
      userPermissionIds.length > 0
        ? this.syncPermissionsToRole(EnumRoleName.USER, userPermissionIds)
        : Promise.resolve()
    ]);

    return {
      discoveredRoutes: availableRoutes.length,
      moduleTags: [...new Set(availableRoutes.map((route) => route.module).sort())],
      deletedPermissions: syncStats.deletedPermissions,
      createdPermissions: syncStats.createdPermissions,
      adminPermissionCount: allPermissionIds.length,
      userPermissionCount: userPermissionIds.length
    };
  }

  private async ensureBaseRoles(): Promise<void> {
    for (const name of [EnumRoleName.ADMIN, EnumRoleName.USER] as const) {
      const existing = await this.roleRepository.findRoleByName(name);
      if (existing) continue;
      const created = await this.roleRepository.createRole({
        name,
        description: name === EnumRoleName.ADMIN ? 'Administrator' : 'User',
        isActive: true,
        permissionIds: []
      });
      if (!created) {
        throw new Error(`Failed to create role: ${name}`);
      }
    }
  }

  private async syncPermissions(availableRoutes: AvailableRoute[]): Promise<{
    deletedPermissions: number;
    createdPermissions: number;
  }> {
    const permissionsInDatabase = await this.permissionRepository.findPermissions({ limit: 9999, skip: 0 });

    const permissionsInDatabaseMap = permissionsInDatabase.reduce(
      (acc, permission) => {
        const props = permission.toObject<PermissionFullProps>();
        acc[`${props.method}-${props.path}`] = props;
        return acc;
      },
      {} as Record<string, PermissionFullProps>
    );

    const availableRoutesMap = availableRoutes.reduce(
      (acc, route) => {
        acc[`${route.method}-${route.path}`] = route;
        return acc;
      },
      {} as Record<string, AvailableRoute>
    );

    const permissionsToDelete = permissionsInDatabase.filter(
      (permission) => !availableRoutesMap[`${permission.getProps().method}-${permission.getProps().path.value}`]
    );

    const deletedPermissions =
      permissionsToDelete.length > 0
        ? await this.permissionRepository.deletePermissions(
            permissionsToDelete.map((permission) => permission.id.toString())
          )
        : 0;

    const routesToCreate = availableRoutes.filter(
      (route) => !permissionsInDatabaseMap[`${route.method}-${route.path}`]
    );

    const createdPermissions =
      routesToCreate.length > 0
        ? (
            await this.permissionRepository.createPermissions(
              routesToCreate.map((route) => ({
                name: route.name,
                description: '',
                path: route.path,
                method: route.method,
                module: route.module
              }))
            )
          ).length
        : 0;

    return { deletedPermissions, createdPermissions };
  }

  private async syncPermissionsToRole(roleName: EnumRoleName, permissionIds: string[]): Promise<void> {
    const role = await this.roleRepository.findRoleByName(roleName);
    if (!role) {
      throw new Error(`Role ${roleName} not found. Run ensure base roles or seed again.`);
    }

    const currentRoleState = role.getProps();
    await this.roleRepository.updateRole(role.id.toString(), {
      name: currentRoleState.name.value,
      description: currentRoleState.description,
      isActive: currentRoleState.isActive,
      permissionIds
    });
  }
}
