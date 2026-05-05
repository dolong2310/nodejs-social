import { PermissionNotFoundException } from '@/modules/permission/application/permission.exception';
import {
  GetPermissionPort,
  GetPermissionQuery
} from '@/modules/permission/application/use-cases/get-permission/get-permission.port';
import { PermissionListItem } from '@/modules/permission/application/use-cases/list-permissions/list-permissions.port';
import { PermissionRepositoryPort } from '@/modules/permission/domain/repositories/permission.repository';

export class GetPermissionUseCase extends GetPermissionPort {
  constructor(private readonly permissionRepository: PermissionRepositoryPort) {
    super();
  }

  async execute(query: GetPermissionQuery) {
    const entity = await this.permissionRepository.findPermissionById(query.id);
    if (!entity) {
      throw new PermissionNotFoundException();
    }
    return new PermissionListItem(entity.toObject());
  }
}
