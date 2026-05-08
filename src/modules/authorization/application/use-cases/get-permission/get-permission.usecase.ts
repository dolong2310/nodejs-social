import { PermissionNotFoundException } from '@/modules/authorization/application/exceptions/permission.exception';
import {
  GetPermissionPort,
  GetPermissionQuery
} from '@/modules/authorization/application/use-cases/get-permission/get-permission.port';
import { PermissionListItem } from '@/modules/authorization/application/use-cases/list-permissions/list-permissions.port';
import { PermissionRepositoryPort } from '@/modules/authorization/domain/repositories/permission.repository';

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
