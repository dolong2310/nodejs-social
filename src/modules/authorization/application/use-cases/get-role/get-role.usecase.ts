import { RoleNotFoundException } from '@/modules/authorization/application/exceptions/role.exception';
import { GetRolePort, GetRoleQuery } from '@/modules/authorization/application/use-cases/get-role/get-role.port';
import { RoleListItem } from '@/modules/authorization/application/use-cases/list-roles/list-roles.port';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';

export class GetRoleUseCase extends GetRolePort {
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
