/**
 * Đồng bộ permission từ các route HTTP (Express) + gán cho role ADMIN/USER.
 * Chạy: `pnpm run seed:permissions:mongo -- --env=development`.
 *
 * Prerequisite:
 * Run `pnpm run db:migrate:mongo --env=development` first.
 */
import { appConfig } from '@/bootstrap/config/app.config';
import logger from '@/infrastructure/logger/create-logger';
import { dbConfig } from '@/infrastructure/persistence/config/database.config';
import { MongoDatabase } from '@/infrastructure/persistence/mongodb/database';
import { PermissionRepository } from '@/modules/authorization/infrastructure/persistence/mongo/permission.impl.repository';
import { PermissionMapper } from '@/modules/authorization/infrastructure/persistence/mongo/permission.mapper';
import { RoleRepository } from '@/modules/authorization/infrastructure/persistence/mongo/role.impl.repository';
import { RoleMapper } from '@/modules/authorization/infrastructure/persistence/mongo/role.mapper';
import { SyncRolePermissionsUseCase } from '@/modules/operations/application/use-cases/sync-role-permissions/sync-role-permissions.usecase';
import { HttpRoutePermissionCatalog } from '@/modules/operations/presentation/http-route-permission-catalog';

const databaseService = new MongoDatabase({
  uri: dbConfig.mongodb.uri,
  readUri: dbConfig.mongodb.readUri,
  databaseName: dbConfig.mongodb.name
});
const permissionRepository = new PermissionRepository(
  databaseService.db,
  databaseService.dbClient,
  new PermissionMapper(),
  logger
);
const roleRepository = new RoleRepository(databaseService.db, databaseService.dbClient, new RoleMapper(), logger);

async function main(): Promise<void> {
  await databaseService.connect();

  const syncRolePermissionsUC = new SyncRolePermissionsUseCase(
    permissionRepository,
    roleRepository,
    new HttpRoutePermissionCatalog({ apiPrefix: appConfig.api.prefix })
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
