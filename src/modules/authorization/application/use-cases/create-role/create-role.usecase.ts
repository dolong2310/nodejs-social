import { RoleNameAlreadyExistsException } from '@/modules/authorization/application/exceptions/role.exception';
import {
  CreateRoleInputPort,
  CreateRolePort
} from '@/modules/authorization/application/use-cases/create-role/create-role.port';
import { RoleListItem } from '@/modules/authorization/application/use-cases/list-roles/list-roles.port';
import { RoleRepositoryPort } from '@/modules/authorization/domain/repositories/role.repository';

export class CreateRoleUseCase extends CreateRolePort {
  constructor(private readonly roleRepository: RoleRepositoryPort) {
    super();
  }

  async execute(input: CreateRoleInputPort) {
    const duplicate = await this.roleRepository.findRoleByName(input.name);
    if (duplicate) {
      throw new RoleNameAlreadyExistsException();
    }
    const entity = await this.roleRepository.insertRole({
      name: input.name,
      description: input.description ?? '',
      isActive: input.isActive ?? true,
      permissionIds: input.permissionIds ?? []
    });
    return new RoleListItem(entity.toObject());
  }
}
