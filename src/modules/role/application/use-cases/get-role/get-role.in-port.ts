import { UseCase } from '@/modules/core/application/base.usecase';
import { RoleListItem } from '@/modules/role/application/use-cases/list-roles/list-roles.in-port';

export class GetRoleQuery {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export abstract class GetRoleInPort implements UseCase<GetRoleQuery, RoleListItem> {
  abstract execute(query: GetRoleQuery): Promise<RoleListItem>;
}
