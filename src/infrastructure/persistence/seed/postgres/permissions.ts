/**
 * Sync permissions from HTTP routes and assign them to ADMIN/USER roles in Postgres.
 *
 * Run:
 * `pnpm run seed:permissions:postgres -- --env=development`
 */
import logger from '@/infrastructure/logger/create-logger';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { PostgresDatabase } from '@/infrastructure/persistence/postgres/database';
import { PermissionRepository } from '@/modules/authorization/infrastructure/persistence/postgres/permission.impl.repository';
import { PermissionMapper } from '@/modules/authorization/infrastructure/persistence/postgres/permission.mapper';
import { RoleRepository } from '@/modules/authorization/infrastructure/persistence/postgres/role.impl.repository';
import { RoleMapper } from '@/modules/authorization/infrastructure/persistence/postgres/role.mapper';
import { SyncRolePermissionsUseCase } from '@/modules/operations/application/use-cases/sync-role-permissions/sync-role-permissions.usecase';
import { HttpRoutePermissionCatalog } from '@/modules/operations/infrastructure/http-route-permission-catalog';

const databaseService = new PostgresDatabase({
  uri: dbConfig.postgres.uri,
  readUris: dbConfig.postgres.readUris,
  ssl: dbConfig.postgres.ssl
});
const permissionRepository = new PermissionRepository(databaseService.pool, new PermissionMapper(), logger);
const roleRepository = new RoleRepository(databaseService.pool, new RoleMapper(), logger);

async function main(): Promise<void> {
  await databaseService.connect();
  await databaseService.initializeSchema();

  const syncRolePermissionsUC = new SyncRolePermissionsUseCase(
    permissionRepository,
    roleRepository,
    new HttpRoutePermissionCatalog()
  );
  const result = await syncRolePermissionsUC.execute();

  if (process.env.SEED_LOG_ROUTES === '1') {
    console.log('Discovered module tags:', result.moduleTags.join(', '));
  }
  console.log(`1. ✅ Deleted ${result.deletedPermissions} permissions.`);
  console.log(`2. ✅ Created ${result.createdPermissions} permissions.`);
  console.log(`3. ✅ Role ADMIN: assigned ${result.adminPermissionCount} permissions.`);
  console.log(`4. ✅ Role USER: assigned ${result.userPermissionCount} permissions.`);
  console.log('===> Permissions and role assignments synced successfully <===');

  await databaseService.disconnect();
  process.exit(0);
}

void main().catch((err) => {
  console.error(err);
  void databaseService.disconnect().finally(() => process.exit(1));
});
