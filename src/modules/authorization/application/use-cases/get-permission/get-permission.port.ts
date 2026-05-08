import { PermissionListItem } from '@/modules/authorization/application/use-cases/list-permissions/list-permissions.port';
import { UseCase } from '@/modules/core/application/base.usecase';

export class GetPermissionQuery {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export abstract class GetPermissionPort implements UseCase<GetPermissionQuery, PermissionListItem> {
  abstract execute(query: GetPermissionQuery): Promise<PermissionListItem>;
}
