import { UseCase } from '@/modules/core/application/base.usecase';
import { PermissionListItem } from '@/modules/permission/application/use-cases/list-permissions/list-permissions.port';

export class GetPermissionQuery {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export abstract class GetPermissionPort implements UseCase<GetPermissionQuery, PermissionListItem> {
  abstract execute(query: GetPermissionQuery): Promise<PermissionListItem>;
}
