import { UseCase } from '@/modules/core/application/base.usecase';
import { PermissionListItem } from '@/modules/permission/application/use-cases/list-permissions/list-permissions.in-port';

export class GetPermissionQuery {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export abstract class GetPermissionInPort implements UseCase<GetPermissionQuery, PermissionListItem> {
  abstract execute(query: GetPermissionQuery): Promise<PermissionListItem>;
}
