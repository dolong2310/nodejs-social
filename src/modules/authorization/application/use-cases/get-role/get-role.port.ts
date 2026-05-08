import { RoleListItem } from '@/modules/authorization/application/use-cases/list-roles/list-roles.port';
import { UseCase } from '@/modules/core/application/base.usecase';

export class GetRoleQuery {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export abstract class GetRolePort implements UseCase<GetRoleQuery, RoleListItem> {
  abstract execute(query: GetRoleQuery): Promise<RoleListItem>;
}
