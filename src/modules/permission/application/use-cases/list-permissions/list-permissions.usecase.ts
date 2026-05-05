import {
  ListPermissionsPort,
  ListPermissionsQuery,
  ListPermissionsResult,
  PermissionListItem
} from '@/modules/permission/application/use-cases/list-permissions/list-permissions.port';
import { PermissionRepositoryPort } from '@/modules/permission/domain/repositories/permission.repository';

export class ListPermissionsUseCase extends ListPermissionsPort {
  constructor(private readonly permissionRepository: PermissionRepositoryPort) {
    super();
  }

  async execute(query: ListPermissionsQuery): Promise<ListPermissionsResult> {
    const skip = (query.page - 1) * query.limit;
    const [total, entities] = await Promise.all([
      this.permissionRepository.countPermissions(),
      this.permissionRepository.findPermissions({ limit: query.limit, skip })
    ]);
    const items = entities.map((entity) => new PermissionListItem(entity.toObject()));
    return new ListPermissionsResult({ items, total });
  }
}
