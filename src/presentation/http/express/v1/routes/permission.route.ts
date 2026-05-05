import { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { IPermissionController } from '@/presentation/http/express/v1/controllers/permission.controller';
import { validatePaginationQuery } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IPermissionsPipe } from '@/presentation/http/express/v1/pipes/permission.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class PermissionRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'permissions';

  constructor(
    private readonly permissionController: IPermissionController,
    private readonly permissionsPipe: IPermissionsPipe,
    private readonly authGuard: AuthGuard,
    private readonly apiKeyGuard: ApiKeyGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { list, create, getById, update, remove } = this.permissionController;
    const { permissionIdParam, createBodyPipe, updateBodyPipe } = this.permissionsPipe;
    const authGuard = this.authGuard.handler;
    const apiKeyGuard = this.apiKeyGuard.handler;
    const throttler = this.throttlerGuard();

    this.router.get('/', throttler, authGuard, apiKeyGuard, validatePaginationQuery, this.interceptor(list));
    this.router.post('/', throttler, authGuard, apiKeyGuard, createBodyPipe, this.interceptor(create));
    this.router.get('/:permissionId', throttler, authGuard, apiKeyGuard, permissionIdParam, this.interceptor(getById));
    this.router.put(
      '/:permissionId',
      throttler,
      authGuard,
      apiKeyGuard,
      permissionIdParam,
      updateBodyPipe,
      this.interceptor(update)
    );
    this.router.delete(
      '/:permissionId',
      throttler,
      authGuard,
      apiKeyGuard,
      permissionIdParam,
      this.interceptor(remove)
    );
  }
}
