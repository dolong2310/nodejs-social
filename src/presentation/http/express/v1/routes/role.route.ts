import { ApiKeyGuard } from '@/presentation/http/express/guards/api-key.guard';
import { AuthGuard } from '@/presentation/http/express/guards/auth.guard';
import { IRoleController } from '@/presentation/http/express/v1/controllers/role.controller';
import { validatePaginationQuery } from '@/presentation/http/express/v1/pipes/pagination.pipe';
import { IRolesPipe } from '@/presentation/http/express/v1/pipes/role.pipe';
import { BaseRoute } from '@/presentation/http/express/v1/routes/base.route';

export class RoleRoute extends BaseRoute {
  protected override readonly version = 'v1';
  protected override readonly pathName = 'roles';

  constructor(
    private readonly roleController: IRoleController,
    private readonly rolesPipe: IRolesPipe,
    private readonly authGuard: AuthGuard,
    private readonly apiKeyGuard: ApiKeyGuard
  ) {
    super();
    this.createRoutes();
  }

  protected override createRoutes(): void {
    const { roleIdParam, createBodyPipe, updateBodyPipe } = this.rolesPipe;
    const { list, create, getById, update, remove } = this.roleController;
    const authGuard = this.authGuard.handler;
    const apiKeyGuard = this.apiKeyGuard.handler;
    const throttler = this.throttlerGuard();

    this.router.get('/', throttler, authGuard, apiKeyGuard, validatePaginationQuery, this.interceptor(list));
    this.router.post('/', throttler, authGuard, apiKeyGuard, createBodyPipe, this.interceptor(create));
    this.router.get('/:roleId', throttler, authGuard, apiKeyGuard, roleIdParam, this.interceptor(getById));
    this.router.put(
      '/:roleId',
      throttler,
      authGuard,
      apiKeyGuard,
      roleIdParam,
      updateBodyPipe,
      this.interceptor(update)
    );
    this.router.delete('/:roleId', throttler, authGuard, apiKeyGuard, roleIdParam, this.interceptor(remove));
  }
}
