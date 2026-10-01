import { RoleNotFoundException } from '@/modules/authorization/application/exceptions/role.exception';
import {
  GetRolePort,
  type GetRoleInputPort
} from '@/modules/authorization/application/use-cases/get-role/get-role.port';
import { RoleListItem } from '@/modules/authorization/application/use-cases/list-roles/list-roles.port';
import type { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';

export class GetRoleUseCase extends GetRolePort {
  constructor(private readonly roleRepository: RoleRepositoryPort) {
    super();
  }

  async execute(input: GetRoleInputPort) {
    const entity = await this.roleRepository.findRoleById(input.id);
    if (!entity) {
      throw new RoleNotFoundException();
    }
    return new RoleListItem(entity.toObject());
  }
}
