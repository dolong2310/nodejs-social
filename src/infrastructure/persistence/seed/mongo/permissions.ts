/**
 * Đồng bộ permission từ các route HTTP (Express) + gán cho role ADMIN/USER.
 * Chạy: `pnpm run seed:permissions -- --env=development` (cần `.env.development` hoặc đổi `--env`).
 * `npx tsc` chỉ biên dịch, không chạy script — dùng `tsx` như trên hoặc `pnpm run build` rồi `node dist/...`.
 */
import { appConfig } from '@/bootstrap/config/app.config';
// import { envConfig } from '@/bootstrap/config/env.config';
import logger from '@/infrastructure/logger/create-logger';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { MongoDatabase } from '@/infrastructure/persistence/mongodb/database';
import {
  buildStubHttpRouters,
  permissionModuleTagFromBaseRoutePath
} from '@/infrastructure/persistence/seed/stub-http-routers.seed';
import { EHttpMethod, PermissionFullProps } from '@/modules/authorization/domain/entities/permission.type';
import { ERoleName } from '@/modules/authorization/domain/entities/role.type';
import { PermissionRepository } from '@/modules/authorization/infrastructure/persistence/mongo/permission.impl.repository';
import { PermissionMapper } from '@/modules/authorization/infrastructure/persistence/mongo/permission.mapper';
import { RoleRepository } from '@/modules/authorization/infrastructure/persistence/mongo/role.impl.repository';
import { RoleMapper } from '@/modules/authorization/infrastructure/persistence/mongo/role.mapper';
import type { BaseRoute } from '@/presentation/http/express/core/base.route';
import type { Router } from 'express';
// import dotenv from 'dotenv';

// dotenv.config({ path: '.env.development' });

type AvailableRoute = {
  name: string;
  path: string;
  method: EHttpMethod;
  module: string;
};

/**
 * User chỉ nhận các module trong `USER_MODULE_ALLOWLIST`.
 * ROLES và PERMISSIONS chỉ dành cho ADMIN.
 */
const USER_GETS_ALL_PERMISSIONS = false;

/**
 * Các thẻ module (từ mount `BaseRoute.pathName` trong source) — bao phủ mọi router
 * `buildHttpRouters`. Dùng khi `USER_GETS_ALL_PERMISSIONS === false`.
 * Giữ chữ IN HOA, trùng `permission.module` do script sinh.
 */
const USER_MODULE_ALLOWLIST: ReadonlySet<string> = new Set([
  'AUTH',
  'USERS',
  'BOOKMARKS',
  'LIKES',
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

const VALID_HTTP_METHODS = new Set<string>(Object.values(EHttpMethod));

const databaseService = new MongoDatabase({ uri: dbConfig.mongodb.uri, databaseName: dbConfig.mongodb.name });
const permissionRepository = new PermissionRepository(
  databaseService.db,
  databaseService.dbClient,
  new PermissionMapper(),
  logger
);
const roleRepository = new RoleRepository(databaseService.db, databaseService.dbClient, new RoleMapper(), logger);

/** Nối các phần path (có thể từng phần có hoặc không có `/` đầu/cuối) thành một path tuyệt đối bắt đầu bằng `/`. */
function joinExpressPathSegments(...segments: string[]): string {
  const parts = segments
    .map((segment) => segment.replace(/^\/+/, '').replace(/\/+$/, ''))
    .filter((segment) => segment.length > 0);
  return '/' + parts.join('/');
}

type ExpressRouteLayer = { route?: { path: string | string[] | RegExp; methods?: Record<string, boolean> } };

/**
 * Duyệt `router.stack` (Express 5), đọc từng `Route` (path + bật/tắt từng method HTTP), append vào `collectedRoutes`.
 */
function collectRoutesFromExpressRouter(
  expressRouter: Router,
  pathPrefix: string,
  permissionModuleTag: string,
  collectedRoutes: AvailableRoute[]
): void {
  for (const layer of expressRouter.stack as ExpressRouteLayer[]) {
    const expressRoute = layer.route;
    if (!expressRoute) continue;

    const routePathPattern =
      typeof expressRoute.path === 'string'
        ? expressRoute.path
        : Array.isArray(expressRoute.path)
          ? expressRoute.path[0]!
          : String(expressRoute.path);

    const fullHttpPath = joinExpressPathSegments(pathPrefix, routePathPattern);
    const methodFlags = expressRoute.methods;
    if (!methodFlags) continue;

    for (const methodName of Object.keys(methodFlags)) {
      if (methodName === '_all' || !methodFlags[methodName]) continue;
      const httpMethod = methodName.toUpperCase();
      if (!VALID_HTTP_METHODS.has(httpMethod)) continue;
      collectedRoutes.push({
        name: `${httpMethod}+${fullHttpPath}`,
        path: fullHttpPath,
        method: httpMethod as EHttpMethod,
        module: permissionModuleTag
      });
    }
  }
}

/**
 * Gom mọi route từ danh sách `BaseRoute` (như lúc app mount) + loại bản ghi trùng cùng `method + path`.
 */
function discoverApiRoutesFromBaseRouteList(baseRouteList: BaseRoute[]): AvailableRoute[] {
  const allDiscoveredRoutes: AvailableRoute[] = [];
  for (const baseRoute of baseRouteList) {
    const fullMountPath = joinExpressPathSegments(appConfig.api.prefix, baseRoute.getVersion(), baseRoute.getPath());
    const permissionModuleTag = permissionModuleTagFromBaseRoutePath(baseRoute.getPath());
    collectRoutesFromExpressRouter(
      baseRoute.getRouter() as unknown as Router,
      fullMountPath,
      permissionModuleTag,
      allDiscoveredRoutes
    );
  }
  const alreadySeenMethodPathKeys = new Set<string>();
  return allDiscoveredRoutes.filter((route) => {
    const methodPathKey = `${route.method}-${route.path}`;
    if (alreadySeenMethodPathKeys.has(methodPathKey)) return false;
    alreadySeenMethodPathKeys.add(methodPathKey);
    return true;
  });
}

async function ensureBaseRoles(): Promise<void> {
  for (const name of [ERoleName.ADMIN, ERoleName.USER] as const) {
    const existing = await roleRepository.findRoleByName(name);
    if (existing) continue;
    const created = await roleRepository.createRole({
      name,
      description: name === ERoleName.ADMIN ? 'Administrator' : 'User',
      isActive: true,
      permissionIds: []
    });
    if (!created) {
      throw new Error(`Failed to create role: ${name}`);
    }
  }
}

async function main() {
  await databaseService.connect();
  const routers = buildStubHttpRouters();
  const availableRoutes = discoverApiRoutesFromBaseRouteList(routers);
  if (process.env.SEED_LOG_ROUTES === '1') {
    const uniqueModuleTags = new Set(availableRoutes.map((route) => route.module).sort());
    console.log('Discovered module tags:', [...uniqueModuleTags].join(', '));
  }
  await ensureBaseRoles();
  await syncPermissions(availableRoutes);

  const permissions = await permissionRepository.findPermissions({
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
    allPermissionIds.length > 0 ? syncPermissionsToRole(ERoleName.ADMIN, allPermissionIds) : Promise.resolve(),
    userPermissionIds.length > 0 ? syncPermissionsToRole(ERoleName.USER, userPermissionIds) : Promise.resolve()
  ]);

  console.log('✅ Permissions and role assignments synced successfully.');
  await databaseService.disconnect();
  process.exit(0);
}

async function syncPermissions(availableRoutes: AvailableRoute[]) {
  const permissionsInDatabase = await permissionRepository.findPermissions({ limit: 9999, skip: 0 });

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
    (permission) => !availableRoutesMap[`${permission.getProps().method}-${permission.getProps().path}`]
  );

  if (permissionsToDelete.length > 0) {
    const deletedCount = await permissionRepository.deletePermissions(
      permissionsToDelete.map((permission) => permission.id.toString())
    );
    console.log(`1. Deleted ${deletedCount} permissions.`);
  } else {
    console.log('1. No permissions to delete.');
  }

  const routesToCreate = availableRoutes.filter((route) => !permissionsInDatabaseMap[`${route.method}-${route.path}`]);

  if (routesToCreate.length > 0) {
    const createdRoutes = await permissionRepository.createPermissions(
      routesToCreate.map((route) => ({
        name: route.name,
        description: '',
        path: route.path,
        method: route.method,
        module: route.module
      }))
    );
    console.log(`2. Created ${createdRoutes.length} permissions.`);
  } else {
    console.log('2. No new permissions to create.');
  }
}

async function syncPermissionsToRole(roleName: string, permissionIds: string[]) {
  const role = await roleRepository.findRoleByName(roleName);
  if (!role) {
    throw new Error(`Role ${roleName} not found. Run ensure base roles or seed again.`);
  }
  const currentRoleState = role.getProps();
  const updated = await roleRepository.updateRole(role.id.toString(), {
    name: currentRoleState.name,
    description: currentRoleState.description,
    isActive: currentRoleState.isActive,
    permissionIds
  });
  console.log(`3. Role ${roleName}: assigned ${permissionIds.length} permissions (${updated ? 'ok' : 'failed'}).`);
}

void main().catch((err) => {
  console.error(err);
  void databaseService.disconnect().finally(() => process.exit(1));
});
