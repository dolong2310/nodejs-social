import { PermissionNotFoundException } from '@/modules/permission/application/permission.exception';
import {
  GetPermissionInPort,
  GetPermissionQuery
} from '@/modules/permission/application/use-cases/get-permission/get-permission.in-port';
import { PermissionListItem } from '@/modules/permission/application/use-cases/list-permissions/list-permissions.in-port';
import { PermissionRepositoryPort } from '@/modules/permission/domain/repositories/permission.repository';

export class GetPermissionInteractor extends GetPermissionInPort {
  constructor(private readonly permissionRepository: PermissionRepositoryPort) {
    super();
  }

  async execute(query: GetPermissionQuery) {
    const entity = await this.permissionRepository.findPermissionById(query.id);
    if (!entity) {
      throw PermissionNotFoundException;
    }
    return new PermissionListItem(entity.toObject());
  }
}
