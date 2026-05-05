import {
  ListRolesPort,
  ListRolesQuery,
  ListRolesResult,
  RoleListItem
} from '@/modules/role/application/use-cases/list-roles/list-roles.port';
import { RoleRepositoryPort } from '@/modules/role/domain/repositories/role.repository';

export class ListRolesUseCase extends ListRolesPort {
  constructor(private readonly roleRepository: RoleRepositoryPort) {
    super();
  }

  async execute(query: ListRolesQuery): Promise<ListRolesResult> {
    const skip = (query.page - 1) * query.limit;
    const [total, entities] = await Promise.all([
      this.roleRepository.countRoles(),
      this.roleRepository.findRoles({ limit: query.limit, skip })
    ]);
    const items = entities.map((entity) => new RoleListItem(entity.toObject()));
    return new ListRolesResult({ items, total });
  }
}
