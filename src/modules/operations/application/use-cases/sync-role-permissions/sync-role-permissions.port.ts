import { UseCase } from '@/modules/core/application/base.usecase';

export type RolePermissionSyncResult = {
  discoveredRoutes: number;
  moduleTags: string[];
  deletedPermissions: number;
  createdPermissions: number;
  adminPermissionCount: number;
  userPermissionCount: number;
};

export abstract class SyncRolePermissionsPort implements UseCase<void, RolePermissionSyncResult> {
  abstract execute(): Promise<RolePermissionSyncResult>;
}
