import { RoleNotFoundException } from '@/modules/role/application/role.exception';
import { GetRoleInPort, GetRoleQuery } from '@/modules/role/application/use-cases/get-role/get-role.in-port';
import { RoleListItem } from '@/modules/role/application/use-cases/list-roles/list-roles.in-port';
import { RoleRepositoryPort } from '@/modules/role/domain/repositories/role.repository';

export class GetRoleInteractor extends GetRoleInPort {
  constructor(private readonly roleRepository: RoleRepositoryPort) {
    super();
  }

  async execute(query: GetRoleQuery) {
    const entity = await this.roleRepository.findRoleById(query.id);
    if (!entity) {
      throw new RoleNotFoundException();
    }
    return new RoleListItem(entity.toObject());
  }
}
