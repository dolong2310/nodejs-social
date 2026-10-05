import {
  ListRolesPort,
  type ListRolesInputPort,
  ListRolesOutputPort,
  RoleListItem
} from '@/modules/authorization/application/use-cases/list-roles/list-roles.port';
import type { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';

export class ListRolesUseCase extends ListRolesPort {
  constructor(private readonly roleRepository: RoleRepositoryPort) {
    super();
  }

  async execute(input: ListRolesInputPort): Promise<ListRolesOutputPort> {
    const skip = (input.page - 1) * input.limit;
    const [total, entities] = await Promise.all([
      this.roleRepository.countRoles(),
      this.roleRepository.findRoles({ limit: input.limit, skip })
    ]);
    const items = entities.map((entity) => new RoleListItem(entity.toObject()));
    return new ListRolesOutputPort({ items, total });
  }
}
