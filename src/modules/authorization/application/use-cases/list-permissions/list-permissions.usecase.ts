import {
  ListPermissionsPort,
  ListPermissionsInputPort,
  ListPermissionsOutputPort,
  PermissionListItem
} from '@/modules/authorization/application/use-cases/list-permissions/list-permissions.port';
import { PermissionRepositoryPort } from '@/modules/authorization/domain/repositories/permission.repository';

export class ListPermissionsUseCase extends ListPermissionsPort {
  constructor(private readonly permissionRepository: PermissionRepositoryPort) {
    super();
  }

  async execute(input: ListPermissionsInputPort): Promise<ListPermissionsOutputPort> {
    const skip = (input.page - 1) * input.limit;
    const [total, entities] = await Promise.all([
      this.permissionRepository.countPermissions(),
      this.permissionRepository.findPermissions({ limit: input.limit, skip })
    ]);
    const items = entities.map((entity) => new PermissionListItem(entity.toObject()));
    return new ListPermissionsOutputPort({ items, total });
  }
}
