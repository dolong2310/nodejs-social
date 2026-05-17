import { ClearCachePort } from '@/modules/operations/application/use-cases/clear-cache/clear-cache.port';
import { SyncRolePermissionsPort } from '@/modules/operations/application/use-cases/sync-role-permissions/sync-role-permissions.port';
import { BaseController } from '@/presentation/http/express/core/base.controller';
import { AutoBind } from '@/presentation/http/express/decorators/autoBind.decorator';
import { ExpressRequest, ExpressResponse } from '@/presentation/http/express/types';
import { NextFunction } from 'express';

export interface IOperationsController {
  clearRedisCache(req: ExpressRequest, res: ExpressResponse, next: NextFunction): Promise<unknown>;
  syncRolePermissions(req: ExpressRequest, res: ExpressResponse, next: NextFunction): Promise<unknown>;
}

export class OperationsController extends BaseController implements IOperationsController {
  constructor(
    private readonly clearCacheUC: ClearCachePort,
    private readonly syncRolePermissionsUC: SyncRolePermissionsPort
  ) {
    super();
  }

  @AutoBind()
  async clearRedisCache(): Promise<unknown> {
    await this.clearCacheUC.execute();
    return this.response({ message: 'Redis cache cleared successfully' });
  }

  @AutoBind()
  async syncRolePermissions(): Promise<unknown> {
    const result = await this.syncRolePermissionsUC.execute();
    return this.response({ data: result, message: 'Role permissions synced successfully' });
  }
}
