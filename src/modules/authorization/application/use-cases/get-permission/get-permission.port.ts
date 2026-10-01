import type { PermissionListItem } from '@/modules/authorization/application/use-cases/list-permissions/list-permissions.port';
import type { UseCase } from '@/modules/core/application/base.usecase';

export class GetPermissionInputPort {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export abstract class GetPermissionPort implements UseCase<GetPermissionInputPort, PermissionListItem> {
  abstract execute(input: GetPermissionInputPort): Promise<PermissionListItem>;
}
