import type { RoleListItem } from '@/modules/authorization/application/use-cases/list-roles/list-roles.port';
import type { UseCase } from '@/modules/core/application/base.usecase';

export class GetRoleInputPort {
  id: string;
  constructor(id: string) {
    this.id = id;
  }
}

export abstract class GetRolePort implements UseCase<GetRoleInputPort, RoleListItem> {
  abstract execute(input: GetRoleInputPort): Promise<RoleListItem>;
}
