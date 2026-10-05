import type { UseCase } from '@/modules/core/application/base.usecase';

export type RolePermissionSyncOutputPort = {
  discoveredRoutes: number;
  moduleTags: string[];
  deletedPermissions: number;
  createdPermissions: number;
  adminPermissionCount: number;
  userPermissionCount: number;
};

export abstract class SyncRolePermissionsPort implements UseCase<void, RolePermissionSyncOutputPort> {
  abstract execute(): Promise<RolePermissionSyncOutputPort>;
}
